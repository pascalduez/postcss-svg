import { Promise } from 'es6-promise';
import base64 from 'base-64';
import utf8 from 'utf8';

const optimize = (svg, opts = {}) => {
  const svgo = new (require('svgo'))(opts);

  return new Promise((resolve, reject) => {
    svgo.optimize(svg, (res) => {
      res.error ? reject(new Error(res.error)) : resolve(res);
    });
  });
};

/**
 * Format a proper SVG data URI.
 * @param {Object}
 * @link https://tools.ietf.org/html/rfc2397
 * @link http://www.w3.org/TR/SVG11/linking.html
 * @see data:[<MIME-type>][;charset=<encoding>][;base64],<data>[#fragment]
 * @return {String}
 */
export function svgDataUri({
  data = '',
  mimeType = 'image/svg+xml',
  encoding = 'charset=utf-8',
  fragment = ''
}) {
  return [
    'data:',
    mimeType,
    `;${encoding}`,
    `,${data}`,
    `#${fragment}`
  ]
  .filter(part => part.length > 1)
  .join('');
}

/**
 * Optimize and encode an svg file data.
 * @param {Buffer} buff
 * @param {String} encoding
 * @return {Promise}
 */
export function svgEncode(buff, encoding = 'escaped') {
  if (!/base64|escaped|raw/.test(encoding)) {
    throw new Error("`encoding` must be either 'base64', 'escaped' or 'raw'");
  }

  let data = buff.toString('utf8');
  data = clean(data);

  let encode = {
    base64(res) {
      return base64.encode(data);
    },
    raw(res) {
      return data.replace(/#/g, '%23');
    },
    escaped(res) {
      return encodeURIComponent(data)
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/#/g, '%23');
    }
  }[encoding];

  // return optimize(data).then(encode);
  return encode(data);
}

function clean(str) {
  return str
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(\S)\n(\S)/g, '$1 $2')
    .replace(/(\/?>)\s+(<)/g, '$1$2')
    .replace(/\s{2,}/g, ' ');
}
