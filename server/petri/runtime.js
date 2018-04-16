const _ = require('lodash');
const logger = require('../logger')('petri/runtime');

class PetriRuntime {
  constructor(db, base) {
    this.db = db;
    this.base = base;
    this.cache = {};
    this.dirty = false;

    this.get = this.get.bind(this);
  }

  async get(key) {
    if (key in this.cache) {
      return this.cache[key];
    }
    const res = await this.db.get(key) || 0;
    this.cache[key] = res;
    return res;
  }

  async incr(obj) {
    if (!_.every(obj, (value) => value > 0)) {
      throw new Error('value must be positive');
    }
    await Promise.all(_.keys(obj).map(this.get));
    logger.trace('Incr', obj);
    _.forIn(obj, (value, key) => {
      this.cache[key] += value;
      this.dirty = true;
    });
  }

  async decr(obj) {
    if (!_.every(obj, (value) => value > 0)) {
      throw new Error('value must be positive');
    }
    await Promise.all(_.keys(obj).map(this.get));
    if (!_.every(obj, (value, key) => this.cache[key] >= value)) {
      return false;
    }
    logger.trace('Decr', obj);
    _.forIn(obj, (value, key) => {
      this.cache[key] -= value;
      this.dirty = true;
    });
    return true;
  }

  async finalize() {
    logger.info('Finalizing', this.cache);
    const op = _.mapKeys(this.cache, (v, k) => this.base + k);
    logger.debug('Operation', op);
    await this.db.setMultiple(op);
    this.dirty = false;
  }
}

module.exports = PetriRuntime;
