const { Parser } = require('expr-eval');
const logger = require('../logger')('integration/expression');

module.exports.exec = (code, variables) => {
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    return expr.evaluate(variables);
  } catch (e) {
    return null;
  }
};

module.exports.wrapped = (code, variables) => {
  let action;
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    action = {
      type: 'done',
      result: expr.evaluate(variables),
    };
  } catch (e) {
    logger.warn('Expr fail', code);
    action = {
      type: 'failure',
      result: e.stack,
    };
  }
  logger.silly('Expr result', { code, action });
  return action;
};
