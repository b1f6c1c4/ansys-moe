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
    const sets = _.toPairs(obj);
    while (sets.length) {
      await this.etcd.stm().transact((tx) => Promise.all(
        sets.splice(0, 128).map(([key, value]) => tx.put(key).value(value)),
      ));
    }
  }
}

module.exports = EtcdAdapter;
