const { Etcd3 } = require('etcd3');
const logger = require('./logger')('etcd');

let client;

const connect = () => {
  const raw = JSON.parse(process.env.ETCD_ENDPOINTS || '["localhost:2379"]');
  const endpoints = raw.map((r) => r.startsWith('http') ? r : `http://${r}`);
  logger.debug('Etcd endpoints', endpoints);

  client = new Etcd3({
    hosts: endpoints,
  });
};

module.exports = new Proxy({}, {
  get(target, propKey) {
    if (propKey === 'connect') {
      return connect;
    }
    return client[propKey];
  },
});
