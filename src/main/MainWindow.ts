import Window from './Window';
import { resolveHtmlPath } from './utils';

export default class MainWindow extends Window{
  constructor() {
    super({contentPath: resolveHtmlPath('index.html')})
  }
}
