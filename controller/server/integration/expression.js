const { Parser } = require('expr-eval');
const logger = require('../logger')('integration/expression');

module.exports = (code, variables, info) => {
  logger.debug(`Run expr ${code}`, info);
  let action;
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    action = {
      type: 'done',
      result: [expr.evaluate(variables)],
    };
  } catch (e) {
    action = {
      type: 'failure',
      result: e.stack,
    };
  }
  const result = {
    ...info,
    kind: 'expression',
    action,
  };
  logger.debug('Expr result', result);
  return result;
};
