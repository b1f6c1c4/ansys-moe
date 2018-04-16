const _ = require('lodash');
const logger = require('../logger')('petri/runtime');

class PetriRuntime {
  constructor(db, base) {
    this.db = db;
    this.base = base;
    this.cache = {};
    this.dirty = false;
    this.dyns = [];

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
    const dyns = {};
    _.forIn(obj, (value, key) => {
      this.cache[key] += value;
      this.dirty = true;
      this.dyns.filter((d) => key.startsWith(d)).forEach((d) => {
        const k = `${d}/#`;
        dyns[k] = (dyns[k] || 0) + value;
      });
    });
    if (_.keys(dyns).length) {
      logger.trace('Incr dyns', dyns);
      await Promise.all(_.keys(dyns).map(this.get));
      _.forIn(dyns, (value, key) => {
        this.cache[key] += value;
      });
    }
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

  async dyn(path) {
    await this.incr({ [path]: 1 });
    this.dyns.push(path);
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
