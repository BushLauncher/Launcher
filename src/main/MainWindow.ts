import Window from './Window';

import { resolveHtmlPath } from '../global/Utils';

export default class MainWindow extends Window{
  constructor() {
    super({contentPath: resolveHtmlPath('index.html')})
  }
}
