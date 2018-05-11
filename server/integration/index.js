const amqp = require('../amqp');
const expression = require('./expression');
const rlang = require('./rlang');
const { cIdGen } = require('../util');
const logger = require('../logger')('integration');

const theQueue = [];

module.exports.virtualQueue = theQueue;

module.exports.run = (kind, code, variables, info) => {
  logger.debug(`Run integration ${kind}`, info);
  const { proj, name, root } = info;
  const id = cIdGen(info);
  switch (kind) {
    case 'expression':
      theQueue.push(expression.wrapped(code, variables, {
        name,
        base: `/${proj}/state`,
        root,
      }));
      break;
    case 'rlang':
      amqp.publish(kind, rlang.run(code, variables), id);
      break;
    default:
      theQueue.push({
        name,
        base: `/${proj}/state`,
        root,
        kind,
        action: { type: 'failure', result: 'Kind not supported' },
      });
      break;
  }
};

module.exports.cancel = (kind, info) => {
  amqp.cancel(kind, cIdGen(info));
};

module.exports.parse = ({ kind, action }, ...args) => {
  logger.trace(`Parse integration ${kind}`, action);
  switch (kind) {
    case 'expression':
      return action.type === 'done' ? action.result : null;
    case 'rlang':
      return rlang.parse(action, ...args);
    default:
      logger.error('Kind not supported', kind);
      return null;
  }
};
