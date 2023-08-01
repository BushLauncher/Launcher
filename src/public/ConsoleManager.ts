import RenderConsoleManager from './RenderConsoleManager';

export enum ProcessType {
  Internal = 'Internal', Render = 'Render', Third = 'Third'
}

export default class ConsoleManager extends RenderConsoleManager {


  constructor(prefix: string, process: ProcessType) {
    super(prefix, process);
    this.logger = this.isRenderer() ? console : require('electron-log');
    this.logger.transports.console.format = '[{h}:{i}:{s}] {text}';
    this.logger.transports.console.useStyles = false;
    this.logger.transports.file.format = '[{d}/{m}/{y} {h}:{i}:{s}.{ms}] [{processType}] {text}';
  }

  isRenderer() {
    return this.process === ProcessType.Render || typeof process === 'undefined' || !process || process.type === 'renderer';
  }
}
