const _ = require('lodash');

class EtcdAdapter {
  constructor(etcd) {
    this.etcd = etcd;
  }

  async get(key) {
    return this.etcd.get(key).number();
  }

  async set(key, value) {
    return this.etcd.put(key).value(value).exec();
  }

  async setMultiple(obj) {
    return this.etcd.stm().transact((tx) => Promise.all(
      _.toPairs(obj).map(([key, value]) => tx.put(key).value(value)),
    ));
  }
}

module.exports = EtcdAdapter;
