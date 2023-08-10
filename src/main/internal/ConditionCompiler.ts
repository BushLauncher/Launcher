import { CompileResult, Condition, PreloadVar, ServiceCondition } from '../../public/GameDataPublic';
import ConsoleManager, { ProcessType } from '../../public/ConsoleManager';
import axios from 'axios';

const console = new ConsoleManager('ConditionCompiler', ProcessType.Internal);

export function transform(rawConditions: string): Condition[] {
  return <Condition[]>JSON.parse(rawConditions);
}

export function stringify(conditions: Condition[]): string {
  return JSON.stringify(conditions);
}

//    OS === "win" && BB == false   ->   [{var:"OS", state: 'win'}, {var:"BB", state: 'false'}]

export function Compile(conditions: Condition[] | Condition): CompileResult {
  if (Array.isArray(conditions)) {
    conditions.forEach(condition => {
      if (getPreloadVar(condition.var) !== condition.state) return { result: false, var: condition.var };
    });
    return { result: true };
  } else {
    return {
      result: getPreloadVar(conditions.var) === conditions.state,
      var: conditions.var
    };
  }

}


export async function CompileService(serviceCondition: ServiceCondition): Promise<CompileResult | string> {
  if (serviceCondition.address === '') return 'Service Condition address is null, it was skipped';
  else if (!serviceCondition.address.startsWith('https:')) return 'Function doesn\'t accept unsecured request, address must start with \'https\'!';
  else {
    const path = serviceCondition.path || '';
    return await axios.get(serviceCondition.address, {
      timeout: 2000,
      timeoutErrorMessage: 'Could not contact service (timeout)',
      responseType: 'json'
    }).then(res => {
      const [key, object] = assignProperty(res.data, path);
      return {
        result: (object[key] === serviceCondition.state),
        var: serviceCondition.address
      };
    }).catch(err => {
      return err.message || err.toString();
    });
  }
}

function assignProperty(object: { [key: string]: any }, path: string): [string, Record<string, unknown>] {
  const properties = path.split('.');
  for (let i = 0; i < properties.length - 1; i++) {
    const property = properties[i];
    object[property] = object[property] ?? {};
    object = object[property] as Record<string, unknown>;
  }
  const key = properties[properties.length - 1];
  return [key, object];
}


function getPreloadVars(...vars: PreloadVar[]) {
  const response: any[] = [];
  vars.forEach(v => response.push(getPreloadVar(v)));
  return response;
}

function getPreloadVar(v: PreloadVar): any | undefined {
  switch (v) {
    case PreloadVar.OS:
      return process.platform;
    default:
      console.error('Var ' + v + ' is not implemented');
      return undefined;
  }
}
