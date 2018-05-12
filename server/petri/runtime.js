const _ = require('lodash');
const path = require('path');
const logger = require('../logger')('petri/runtime');

class PetriRuntime {
  constructor(db, base, petri) {
    this.db = db;
    this.base = base;
    this.option = null;
    this.root = '';
    this.param = {};
    this.cache = {};
    this.dirty = false;
    this.dyns = [];
    this.petri = petri;
    this.log = undefined;

    this.ensure = this.ensure.bind(this);
  }

  prepareExecution(option, log, param = {}) {
    this.option = option;
    this.root = param.path || '';
    this.param = param;
    this.dyns = [];
    this.log = log;
  }

  makeDbPath(k) {
    return path.posix.join(this.base, k);
  }

  makePath(k) {
    const r = this.root.startsWith('/') ? this.root.substr(1) : this.root;
    const res = path.posix.join(r, k);
    if (this.root.startsWith('/')) {
      return `/${res}`;
    }
    return res;
  }

  get(k) {
    return this.cache[this.makePath(k)];
  }

  set(k, v) {
    this.cache[this.makePath(k)] = v;
  }

  dif(k, v) {
    this.set(k, this.get(k) + v);
  }

  async ensure(k) {
    const key = this.makePath(k);
    if (!(key in this.cache)) {
      const res = await this.db.get(this.makeDbPath(key)) || 0;
      this.cache[key] = res;
    }
    return this.cache[key];
  }

  async incr(obj) {
    /* istanbul ignore if */
    if (!_.isPlainObject(obj)) {
      throw new Error('obj must be plain object');
    }
    /* istanbul ignore if */
    if (!_.every(obj, (value) => value > 0)) {
      throw new Error('value must be positive');
    }
    await Promise.all(_.keys(obj).map(this.ensure));
    logger.silly(`INCR ${this.root}`, obj);
    const dyns = {};
    _.forIn(obj, (value, key) => {
      this.dif(key, value);
      this.dirty = true;
      this.dyns.filter((d) => key.startsWith(d)).forEach((d) => {
        const k = `${d}/#`;
        dyns[k] = (dyns[k] || 0) + value;
      });
    });
    if (_.keys(dyns).length) {
      logger.silly(`INCR ${this.root} dyns`, dyns);
      await Promise.all(_.keys(dyns).map(this.ensure));
      _.forIn(dyns, (value, key) => {
        this.dif(key, value);
      });
    }
  }

  async decr(obj) {
    /* istanbul ignore if */
    if (!_.isPlainObject(obj)) {
      throw new Error('obj must be plain object');
    }
    /* istanbul ignore if */
    if (!_.every(obj, (value) => value > 0)) {
      throw new Error('value must be positive');
    }
    if (!await this.gte(obj)) {
      return false;
    }
    logger.silly(`DECR ${this.root}`, obj);
    _.forIn(obj, (value, key) => {
      this.dif(key, -value);
      this.dirty = true;
    });
    return true;
  }

  async lte(obj) {
    /* istanbul ignore if */
    if (!_.isPlainObject(obj)) {
      throw new Error('obj must be plain object');
    }
    await Promise.all(_.keys(obj).map(this.ensure));
    return _.every(obj, (value, key) => this.get(key) <= value);
  }

  async gte(obj) {
    /* istanbul ignore if */
    if (!_.isPlainObject(obj)) {
      throw new Error('obj must be plain object');
    }
    await Promise.all(_.keys(obj).map(this.ensure));
    return _.every(obj, (value, key) => this.get(key) >= value);
  }

  async dyn(p) {
    await this.incr({ [p]: 1 });
    this.dyns.push(p);
  }

  async done(p) {
    const kt = `${p}/#`;
    const kf = `${p}/@`;
    await this.ensure(p);
    await this.ensure(kt);
    await this.ensure(kf);
    const n = this.get(kt);
    if (this.get(p) > 0 && n === this.get(kf)) {
      logger.silly(`Done ${this.root}`, p);
      this.dif(p, -1);
      this.dif(kt, -n);
      this.dif(kf, -n);
      this.dirty = true;
      return true;
    }
    return false;
  }

  async finalize() {
    logger.trace(`Finalize to ${this.base}`, this.cache);
    const op = _.mapKeys(this.cache, (v, k) => this.makeDbPath(k));
    await this.db.setMultiple(op);
    this.dirty = false;
  }
}

module.exports = PetriRuntime;
