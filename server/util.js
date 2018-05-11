const _ = require('lodash');
const crypto = require('crypto');
const stringify = require('json-stable-stringify');

module.exports.hash = (obj) => {
  const str = stringify(obj);
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return hash.slice(8, 16);
};

module.exports.newId = (l = 8) =>
  Math.round((36 ** (l + 1)) - (Math.random() * (36 ** l))).toString(36).slice(1);

module.exports.cIdGen = ({ proj, name, root }) => root
  ? `${proj}.${name}${root.replace(/\//g, '.')}`
  : `${proj}.${name}`;

module.exports.cIdParse = (id) => {
  const [proj, name, ...rest] = id.split('.');
  return {
    proj,
    name,
    root: rest.length === 0 ? undefined : `/${rest.join('/')}`,
  };
};

// https://gist.github.com/zenparsing/5dffde82d9acef19e43c
module.exports.dedent = (callSite, ...args) => {
  function format(str) {
    let size = -1;

    return str.replace(/\n(\s+)/g, (m, m1) => {
      if (size < 0) {
        size = m1.replace(/\t/g, '    ').length;
      }
      return `\n${m1.slice(Math.min(m1.length, size))}`;
    }).replace(/^\n/, '');
  }

  if (_.isString(callSite)) {
    return format(callSite);
  }

  if (_.isFunction(callSite)) {
    return _.compose(format, callSite);
  }

  const output = callSite
    .slice(0, args.length + 1)
    .map((text, i) => (i === 0 ? '' : args[i - 1]) + text)
    .join('');

  return format(output);
};
