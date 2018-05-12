const _ = require('lodash');
const { Etcd3, PutBuilder } = require('etcd3');
const logger = require('./logger')('etcd');

PutBuilder.prototype.json = function json(obj) {
  return this.value(JSON.stringify(obj));
};

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
  delete: () => ({
    prefix: (value) => ({
      exec: async () => { _.unset(db, _.keys(db).filter((s) => s.startsWith(value))); },
    }),
  }),
  mock: () => db,
};

module.exports = new Proxy({}, {
  get(target, propKey) {
    if (process.env.MOCK_ETCD) {
      return mocking[propKey];
    }
    if (propKey === 'connect') {
      return connect;
    }
    return client[propKey];
  },
});
