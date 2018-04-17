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

const db = {};
const mocking = {
  connect: () => {
    logger.warn('Mocking etcd');
  },
  get: (key) => ({
    number: async () => db[key] && parseInt(db[key], 10),
    json: async () => db[key] && JSON.parse(db[key]),
  }),
  put: (key) => ({
    value: (value) => ({
      exec: async () => { db[key] = JSON.stringify(value); },
    }),
  }),
  mock: () => db,
};

module.exports = new Proxy({}, {
  get(target, propKey) {
    if (process.env.NODE_ENV !== 'production') {
      return mocking[propKey];
    }
    if (propKey === 'connect') {
      return connect;
    }
    return client[propKey];
  },
});
