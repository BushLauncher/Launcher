import Window from './Window';
import { URL } from 'url';
import path from 'path';

export default class MainWindow extends Window{
  constructor() {
    super({contentPath: resolveHtmlPath('index.html')})
  }
}


export function resolveHtmlPath(htmlFileName: string) {
  console.log(path.join(__dirname, '../renderer/', htmlFileName));
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    console.log(url.href);
    return url.href;
  } else return path.join(__dirname, '../renderer/', htmlFileName);
}
