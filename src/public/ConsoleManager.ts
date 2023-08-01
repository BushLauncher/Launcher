import RenderConsoleManager from './RenderConsoleManager';

export enum ProcessType {
  Internal = 'Internal', Render = 'Render', Third = 'Third'
}

export default class ConsoleManager extends RenderConsoleManager{

  constructor(prefix: string, process: ProcessType) {
    super(prefix,process)
    this.logger = this.isRenderer() ? console : require('electron-log');
  }

  isRenderer() {
    return this.process === ProcessType.Render || typeof process === 'undefined' || !process || process.type === 'renderer';
  }
}
