const _ = require('lodash');
const Channel = require('@nodeguy/channel');
const etcd = require('../etcd');
const { PetriNet, CompiledPath } = require('../petri');
const EtcdAdapter = require('../adapter');
const { virtualQueue } = require('../integration');
const logicGlobal = require('./global');
const logicCategory = require('./category');
const logicEval = require('./eval');
const logicIter = require('./iter');
const processCore = require('./core');
const { hash } = require('../util');
const logger = require('../logger')('core');

const channel = new Channel();

const petri = new PetriNet(new EtcdAdapter(etcd));

logicGlobal(petri);
logicCategory(petri);
logicEval(petri);
logicIter(petri);

const customizer = (obj) => (proxy) => new Proxy(proxy, {
  get(target, prop, receiver) {
    switch (prop) {
      case 'retrieve':
        return (key, ...pars) => {
          const compiled = new CompiledPath(key);
          const p = compiled.build(target.context, target.param, ...pars);
          return etcd.get(p);
        };
      case 'store':
        return (key, ...args) => {
          const compiled = new CompiledPath(key);
          const value = args[args.length - 1];
          const pars = args.splice(0, args.length - 1);
          const p = compiled.build(target.context, target.param, ...pars);
          if (_.isObject(value) || _.isArray(value)) {
            return etcd.put(p).json(value).exec();
          }
          return etcd.put(p).value(value).exec();
        };
      case 'action':
        return (name, root, ...pars) => {
          if (root === undefined) {
            return { proj: obj.proj, name, root: target.root };
          }
          if (root === null) {
            return { proj: obj.proj, name };
          }
          const compiled = new CompiledPath(root);
          const p = compiled.build(target.context, target.param, ...pars);
          return {
            proj: obj.proj,
            name,
            root: p,
          };
        };
      case 'cfgHash':
        if (target.option.cfg) {
          const cfgx = target.option.cfg(obj.cfg);
          logger.silly('Excerpted cfg', cfgx);
          return hash(cfgx, true);
        }
        return undefined;
      default:
        if (prop in obj) {
          return obj[prop];
        }
        return Reflect.get(target, prop, receiver);
    }
  },
});

module.exports.channel = channel;

const dispatch = async (payload, context, cust) => {
  const obj = petri.retrieve(payload.name);
  if (!obj) {
    logger.error('Name not found', payload.name);
    return false;
  }
  const { option } = obj;
  if (option.cfg) {
    const cfgx = option.cfg(cust.cfg);
    logger.silly('Excerpted cfg', cfgx);
    const cfgHash = hash(cfgx, true);
    if (payload.cfgHash !== cfgHash) {
      logger.warn('cfgHash not match, drop payload');
      return false;
    }
  }
  await petri.dispatch(payload, context, cust);
  return true;
};

module.exports.run = async () => {
  for (;;) {
    const obj = await channel.shift();
    try {
      let context;
      let cust;
      if (obj.payload.kind === 'core') {
        const res = await processCore(obj);
        if (!res) {
          continue; // eslint-disable-line no-continue
        }
        const { proj } = res;
        const cfg = await etcd.get(`/${proj}/config`).json();
        context = { proj };
        cust = customizer({ proj, cfg });
      } else {
        const { payload, proj } = obj;
        const cfg = await etcd.get(`/${proj}/config`).json();
        context = { proj };
        cust = customizer({ proj, cfg });
        logger.debug('Dispatching payload', payload);
        logger.silly('With config', cfg);
        await dispatch(payload, context, cust);
      }
      while (virtualQueue.length !== 0) {
        const evpld = virtualQueue.shift();
        logger.debug('Dispatching eval payload', evpld);
        await dispatch(evpld, context, cust);
      }
    } catch (e) {
      logger.error('Processing channel', e);
    } finally {
      if (_.isFunction(obj.fin)) {
        obj.fin();
      }
    }
  }
};
