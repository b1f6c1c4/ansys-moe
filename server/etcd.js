const etcdjs = require('etcdjs');
const logger = require('./logger')('etcd');

let etcd;

const connectLocal = async () => {
  const endpoints = JSON.parse(process.env.ETCD_ENDPOINTS || '["localhost:2379"]');
  logger.debug('Etcd endpoints', endpoints);

  try {
    logger.info('Connecting etcd...');
    etcd = etcdjs(endpoints, {
      refresh: true,
      json: true,
    });
    logger.info('Etcd client prepared');
  } catch (e) {
    logger.error('Calling etcdjs()', e);
    throw e;
  }
};

const connect = async () => {
  if (etcd) {
    logger.warn('Try connecting etcd mult times');
    return;
  }

  await connectLocal();
};

module.exports = {
  connect,
  etcd,
};
