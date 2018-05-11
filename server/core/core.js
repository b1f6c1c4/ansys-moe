const { virtualQueue } = require('../integration');
const etcd = require('../etcd');
const logger = require('../logger')('core/core');

module.exports = async ({ payload: { action } }) => {
  const { type, name: proj, config } = action;
  if (type !== 'run') {
    logger.error('Type not supported', type);
    return undefined;
  }
  logger.warn(`Creating project ${proj}`, config);
  await etcd.put(`/${proj}/config`).json(config).exec();
  await virtualQueue.push({
    name: 'init',
    base: `/${proj}/state`,
    root: '',
  });
  return { proj };
};
