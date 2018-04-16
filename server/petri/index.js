const _ = require('lodash');
const PetriRuntime = require('./runtime');
const logger = require('../logger')('petri');

class PetriNet {
  constructor(db, rootRegex) {
    this.db = db;
    this.rootRegex = rootRegex;
    this.internals = {};
    this.externals = {};
  }

  register(option, func) {
    if (_.isString(option)) {
      // eslint-disable-next-line no-param-reassign
      option = { name: option };
    }

    const { name, external, root } = option;

    if (external) {
      this.externals[name] = { root, func };
    } else {
      this.internals[name] = { root, func };
    }
  }

  async dispatch(base, name, payload) {
    const reg = this.externals[name];
    if (!reg) {
      logger.warn('Name not found', name);
      return;
    }
    const r = new PetriRuntime(this.db, base);
    await this.execute(base, r, reg, payload);
    let maxDepth = 10;
    while (r.dirty) {
      r.dirty = false;
      // eslint-disable-next-line no-restricted-syntax
      for (const rg of _.values(this.internals)) {
        // eslint-disable-next-line no-await-in-loop
        await this.execute(base, r, rg);
      }
      // eslint-disable-next-line no-plusplus
      if (--maxDepth <= 0) {
        throw new Error('Potential dead loop');
      }
    }
    await r.finalize();
  }

  /* eslint-disable no-param-reassign */
  async execute(base, r, { root, func }, payload) {
    if (!root) {
      r.root = '';
      await func(r, payload);
      return;
    }
    const vals = _.chain(r.cache)
      .keys()
      .map((k) => k.match(root))
      .map(0)
      .filter()
      .uniq()
      .value();
    // eslint-disable-next-line no-restricted-syntax
    for (const v of vals) {
      r.root = v;
      // eslint-disable-next-line no-await-in-loop
      await func(r, payload);
    }
  }
  /* eslint-enable no-param-reassign */
}

module.exports = {
  PetriNet,
};
