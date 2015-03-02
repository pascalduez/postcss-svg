import fs from 'fs';
import path from 'path';
import list from 'postcss/lib/list';
import balanced from 'balanced-match';
import { svgDataUri, svgEncode } from './svg';

export default function svg(...args) {
  const converter = new Converter(...args);

  return function (css) {
    css.eachDecl(/^background|filter/, converter#processDecl);
  };
}

const quote = str => `"${str}"`;
const url = str => `url("${str}")`;
const reAssets = /((?:url|image|svg)\()(.*)(\))/;

class Converter {
  constructor({
    basePath = process.cwd(),
    encoding = 'escaped',
    simplify = false
  } = {}) {
    this.basePath = basePath;
    this.encoding = encoding;
    this.cache = [];
  }

  processDecl(decl) {
    if (!reAssets.test(decl.value)) return;

    decl.value = list.comma(decl.value)
      .filter(bg => reAssets.test(bg))
      .map(bg => {
        let { pre, body, post } = balanced('url(', ')', bg);

        return `${pre}${this.inline(body)}${post}`;
      })
      .join(', ');
  }

  inline(file) {
    let [ filePath, fragment ] = file.split('#');
    let fileData = this.read(filePath);
    let data = svgEncode(fileData);

    return url(svgDataUri({ data, fragment }));
  }

  read(filePath) {
    if (!(filePath in this.cache)) {
      let ap = path.resolve(this.basePath, filePath);
      this.cache[filePath] = fs.readFileSync(ap);
    }

    return this.cache[filePath];
  }
}
