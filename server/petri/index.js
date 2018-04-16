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
    const { func } = reg;
    const r = new PetriRuntime(this.db, base);
    await func(r, payload);
    let maxDepth = 10;
    while (r.dirty) {
      r.dirty = false;
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(_.values(this.internals).map(({ func: f }) => f(r)));
      // eslint-disable-next-line no-plusplus
      if (--maxDepth <= 0) {
        throw new Error('Potential dead loop');
      }
    }
    await r.finalize();
  }
}

module.exports = {
  PetriNet,
};
