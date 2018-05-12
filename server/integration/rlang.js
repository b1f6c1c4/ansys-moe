const _ = require('lodash');
const { dedent } = require('../util');

module.exports.run = (code, variables) => {
  const imports = _.toPairs(variables).map(([key, value]) =>
    `${key} <- ${value.toString(10)};`).join('\n');
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
    .map(_.unary(JSON.parse))
    .value();
  if (simplify) {
    return vals[0][0];
  }
  return vals;
};
