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

  async dispatch(action) {
    const { name, base } = action;
    const reg = this.externals[name];
    if (!reg) {
      logger.warn('Name not found', name);
      return undefined;
    }
    const r = new PetriRuntime(this.db, base);
    const rv = await PetriNet.execute(r, reg, action);
    let maxDepth = 10;
    while (r.dirty) {
      r.dirty = false;
      // eslint-disable-next-line no-restricted-syntax
      for (const rg of _.values(this.internals)) {
        // eslint-disable-next-line no-await-in-loop
        await PetriNet.execute(r, rg);
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

  /* eslint-disable no-param-reassign */
  static async execute(r, { option, func }, action) {
    const root = _.get(action, 'root');
    const payload = action && _.omit(action, ['base', 'root', 'name']);
    const { name, root: rootRegex } = option;
    logger.trace('Will execute', name);
    if (!rootRegex) {
      r.root = '';
      logger.trace('Will use root', r.root);
      return func(r, payload);
    }
    if (root) {
      const rt = root.match(rootRegex);
      if (!rt) {
        throw new Error('Root not match');
      }
      ([r.root] = rt);
      logger.trace('Will use root', r.root);
      return func(r, payload);
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
      r.root = v;
      logger.trace('Will use root', r.root);
      // eslint-disable-next-line no-await-in-loop
      await func(r, payload);
    }
    return undefined;
  }
  /* eslint-enable no-param-reassign */
}

module.exports = {
  PetriNet,
};
