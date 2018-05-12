const _ = require('lodash');
const PetriRuntime = require('./runtime');
const { CompiledPath } = require('./path');
const logger = require('../logger')('petri');

const makeProxy = (r, context) => new Proxy(r, {
  get(target, prop) {
    switch (prop) {
      case 'context':
        return context;
      case 'ensure':
      case 'dyn':
      case 'done':
        return (p, ...pars) => {
          const compiled = new CompiledPath(p);
          const q = compiled.build(context, target.param, ...pars);
          return target[prop](q);
        };
      case 'incr':
      case 'decr':
      case 'lte':
      case 'gte':
        return (raw, ...pars) => {
          const obj = _.mapKeys(raw, (v, p) => {
            const compiled = new CompiledPath(p);
            return compiled.build(context, target.param, ...pars);
          });
          return target[prop](obj);
        };
      case 'option':
      case 'root':
      case 'param':
      case 'petri':
        return target[prop];
      default:
        return undefined;
    }
  },
  set(target, prop) {
    throw new TypeError(`Cannot set ${prop}`);
  },
  defineProperty(target, prop) {
    throw new TypeError(`Cannot defineProperty ${prop}`);
  },
  deleteProperty(target, prop) {
    throw new TypeError(`Cannot deleteProperty ${prop}`);
  },
  preventExtensions(target, prop) {
    throw new TypeError(`Cannot preventExtensions ${prop}`);
  },
  setPrototypeOf(target, prop) {
    throw new TypeError(`Cannot setPrototypeOf ${prop}`);
  },
});

const checkPrecondition = async ({ pre }, r) => {
  if (!pre) return true;
  if (pre.lte) {
    if (!await r.lte(pre.lte)) return false;
  }
  if (pre.gte) {
    if (!await r.gte(pre.gte)) return false;
  }
  if (pre.decr) {
    if (!await r.decr(pre.decr)) return false;
  }
  if (pre.done) {
    if (!await r.done(pre.done)) {
      if (pre.decr) {
        await r.incr(pre.decr);
      }
      return false;
    }
  }
  return true;
};

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

    _.update(option, 'root', (r) => r && new CompiledPath(r));
    _.update(option, 'pre', (p) => {
      if (_.isString(p)) {
        return { decr: { [p]: 1 } };
      }
      if (_.isArray(p)) {
        return { decr: _.fromPairs(_.map(p, (v) => [v, 1])) };
      }
      return p;
    });

    const registry = external ? this.externals : this.internals;
    /* istanbul ignore if */
    if (name in registry) {
      logger.error('Name duplicated', name);
    }
    registry[name] = { option, func };
    if (external) {
      logger.trace('Registered external', name);
    } else {
      logger.trace('Registered internal', name);
    }
  }

  retrieve(name, external = true) {
    if (external) {
      return this.externals[name];
    }
    return this.internals[name];
  }

  async dispatch(payload, context, customizer = _.identity, ...args) {
    const { name, base } = payload;
    const reg = this.externals[name];
    if (!reg) {
      logger.error('Name not found', name);
      return undefined;
    }
    const r = new PetriRuntime(this.db, base, this);
    const proxy = customizer(makeProxy(r, context));
    const rv = await this.execute(r, proxy, reg, payload, args);
    let maxDepth = 10;
    while (r.dirty) {
      r.dirty = false;
      for (const rg of _.values(this.internals)) {
        await this.execute(r, proxy, rg, undefined, args);
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

  // eslint-disable-next-line class-methods-use-this
  async execute(r, proxy, { option, func }, payload, args) {
    const go = async (rt) => {
      r.prepareExecution(option, rt);
      if (await checkPrecondition(option, r)) {
        logger.trace(`Precodition match, execute ${option.name}`, r.root);
        return func(proxy, payload, ...args);
      }
      return undefined;
    };
    const root = _.get(payload, 'root');
    const { root: rootRegex } = option;
    if (!rootRegex) {
      return go();
    }
    if (root) {
      const rt = rootRegex.match(root);
      if (!rt) {
        throw new Error('Root not match');
      }
      return go(rt);
    }
    const vals = _.chain(r.cache)
      .keys()
      .map((v) => rootRegex.match(v))
      .map('path')
      .filter()
      .uniq()
      .value();
    for (const v of vals) {
      await go(rootRegex.match(v));
    }
    return undefined;
  }
}

module.exports = {
  PetriNet,
  makeProxy,
  CompiledPath,
};
