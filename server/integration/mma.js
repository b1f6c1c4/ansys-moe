const _ = require('lodash');
const { dedent } = require('../util');
const logger = require('../logger')('integration/mma');

module.exports.run = (code, variables) => {
  const imports = _.toPairs(variables).map(([key, value]) =>
    `${key} = ${value.toString(10)}\`;`).join('\n');
  const script = dedent`
    ${imports}
    ${code}
  `;
  return { script };
};

module.exports.parse = ({ type, result }) => {
  if (type !== 'done') {
    return null;
  }
  const res = parseFloat(result);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(res)) {
    logger.warn('Parse mma result fail', result);
    return null;
  }
  return res;
};
