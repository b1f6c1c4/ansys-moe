const _ = require('lodash');
const { dedent } = require('../util');

module.exports.run = (code, variables) => {
  const imports = _.toPairs(variables).map(([key, value]) => {
    if (_.isArray(value)) {
      return `${key} <- c(${value.map((v) => v.toString(10)).join(', ')});`;
    }
    return `${key} <- ${value.toString(10)};`;
  }).join('\n');
  const script = dedent`
    sink(stderr());
    library(jsonlite);
    ${imports}
    sink();
    ${code}
  `;
  return { script };
};

module.exports.parse = ({ type, result }, simplify = true) => {
  if (type !== 'done') {
    return null;
  }
  const sp = result.split('\n');
  const vals = _.chain(sp)
    .filter((s) => /^\{|\[/.test(s))
    .map(_.unary(JSON.parse));
  if (simplify) {
    return vals
      .map((v) => _.isArray(v) && v.length === 1 ? v[0] : v)
      .value();
  }
  return vals.value();
};
