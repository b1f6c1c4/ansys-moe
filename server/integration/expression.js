const { Parser } = require('expr-eval');
const logger = require('../logger')('integration/expression');

module.exports.run = (code, variables) => {
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    return expr.evaluate(variables);
  } catch (e) {
    return null;
  }
};

module.exports.wrapped = (code, variables, info) => {
  let action;
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    action = {
      type: 'done',
      result: [expr.evaluate(variables)],
    };
  } catch (e) {
    logger.warn('Expr fail', code);
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
  logger.silly('Expr result', { code, result });
  return result;
};
