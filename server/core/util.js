const _ = require('lodash');

module.exports.newId = () => Math.random().toString(36).substr(2);

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
