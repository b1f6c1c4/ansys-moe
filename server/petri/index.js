const _ = require('lodash');
const PetriRuntime = require('./runtime');
const logger = require('../logger')('petri');

class PetriNet {
  constructor(db) {
    this.db = db;
    this.internals = {};
    this.externals = {};
  }

  register(option, func) {
    if (_.isString(option)) {
      // eslint-disable-next-line no-param-reassign
      option = { name: option };
    }

    const { name, external } = option;

    const registry = external ? this.externals : this.internals;
    /* istanbul ignore if */
    if (name in registry) {
      logger.warn('Name duplicated', name);
    }
    registry[name] = { option, func };
    if (external) {
      logger.info('Registered external', option);
    } else {
      logger.info('Registered internal', option);
    }
  }

  async dispatch(payload, ...args) {
    const { name, base } = payload;
    const reg = this.externals[name];
    if (!reg) {
      logger.warn('Name not found', name);
      return undefined;
    }
    const r = new PetriRuntime(this.db, base);
    const rv = await PetriNet.execute(r, reg, payload, args);
    let maxDepth = 10;
    while (r.dirty) {
      r.dirty = false;
      // eslint-disable-next-line no-restricted-syntax
      for (const rg of _.values(this.internals)) {
        // eslint-disable-next-line no-await-in-loop
        await PetriNet.execute(r, rg, undefined, args);
      }
      /* istanbul ignore if */
      // eslint-disable-next-line no-plusplus
      if (--maxDepth <= 0) {
        throw new Error('Potential dead loop');
      }
    }
    await r.finalize();
    return rv;
  }

  static async execute(r, { option, func }, payload, args) {
    const root = _.get(payload, 'root');
    const { name, root: rootRegex } = option;
    logger.trace('Will execute', name);
    if (!rootRegex) {
      r.setRoot();
      logger.trace('Will use root', r.root);
      return func(r, payload, ...args);
    }
    if (root) {
      const rt = root.match(rootRegex);
      if (!rt) {
        throw new Error('Root not match');
      }
      r.setRoot(rt);
      logger.trace('Will use root', r.root);
      return func(r, payload, ...args);
    }
    const vals = _.chain(r.cache)
      .keys()
      .map((k) => k.match(rootRegex))
      .map(0)
      .filter()
      .uniq()
      .value();
    // eslint-disable-next-line no-restricted-syntax
    for (const v of vals) {
      r.setRoot(v.match(rootRegex));
      logger.trace('Will use root', r.root);
      // eslint-disable-next-line no-await-in-loop
      await func(r, payload, ...args);
    }
    return undefined;
  }
}

module.exports = {
  PetriNet,
};
