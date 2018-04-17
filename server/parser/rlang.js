const _ = require('lodash');

module.exports = ({ type, result }) => {
  if (type !== 'done') {
    return null;
  }
  const sp = result.split('\n');
  const vals = _.chain(sp)
    .filter((s) => /^\{|\[/.test(s))
    .map(_.unary(JSON.parse))
    .value();
  return vals;
};
