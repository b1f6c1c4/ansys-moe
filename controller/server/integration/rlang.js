const _ = require('lodash');
const { dedent } = require('../util');

module.exports.run = (code, variables) => {
  const imports = _.toPairs(variables).map(([key, value]) => {
    if (_.isArray(value)) {
      return `${key} <- c(${value.map((v) => v.toString(10)).join(', ')})`;
    }
    return `${key} <- ${value.toString(10)}`;
  }).join('\n');
  const script = dedent`
    library(jsonlite)
    ${imports}
    ${code}
  `;
  return { script };
};

module.exports.parse = ({ type, result }) => {
  if (type !== 'done') {
    return null;
  }
  const sp = result.split('\n');
  const vals = _.chain(sp)
    .filter((s) => /^\{|\[/.test(s))
    .map(_.unary(JSON.parse))
    .map((v) => _.isArray(v) && v.length === 1 ? v[0] : v)
    .value();
  return vals;
};
