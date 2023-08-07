import { CompileResult, Condition, PreloadVar } from '../../public/GameDataPublic';
import { isArray } from 'util';


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
