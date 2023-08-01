export enum ProcessType {
  Internal = 'Internal', Render = 'Render', Third = 'Third'
}

export default class RenderConsoleManager {
  readonly prefix!: string;
  readonly process!: ProcessType;
  logger!: any;

  constructor(prefix: string, process: ProcessType) {
    this.process = process;
    this.prefix = `%c[%c${prefix}%c]:`;
    this.logger = console;
  }


  public log(...message: any[]) {
    this.logger?.log(`%c[%c${this.process}%c] ${this.prefix}`, 'color: gray', 'color: white', 'color: gray', 'color: gray', 'color: aqua', 'color: gray', ...message);
  }

  public error(...message: any[]) {
    this.logger?.error(`%c[%c${this.process}%c] ${this.prefix}`, 'color: gray', 'color: white', 'color: gray', 'color: gray', 'color: red', 'color: gray', ...message);
  }

  public warn(...message: any[]) {
    this.logger?.warn(`%c[%c${this.process}%c] ${this.prefix}`, 'color: gray', 'color: white', 'color: gray', 'color: gray', 'color: yellow', 'color: gray', ...message);
  }
}
