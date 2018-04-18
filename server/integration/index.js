const amqp = require('../amqp');
const expression = require('./expression');
const rlang = require('./rlang');
const logger = require('../logger')('integration');

const theQueue = [];

module.exports.virtualQueue = theQueue;

module.exports.run = (kind, code, variables, { proj, name, root }) => {
  logger.info(`Run integration ${kind}`, { proj, name, root });
  const id = root
    ? `${proj}.${name}${root.replace('/', '.')}`
    : `${proj}.${name}`;
  switch (kind) {
    case 'expression':
      theQueue.push(expression(code, variables, {
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

module.exports.parse = ({ kind, action }) => {
  logger.info(`Parse integration ${kind}`, action);
  switch (kind) {
    case 'rlang':
      return rlang.parse(action);
    default:
      logger.error('Kind not supported', kind);
      return null;
  }
};
