const _ = require('lodash');
const etcd = require('../etcd');
const { PetriNet, CompiledPath } = require('../petri');
const EtcdAdapter = require('../adapter');
const { virtualQueue } = require('../integration');
const logicGlobal = require('./global');
const logicCategory = require('./category');
const logicEval = require('./eval');
const logicIter = require('./iter');
const processCore = require('./core');
const { hash, cIdParse } = require('../util');
const logger = require('../logger')('core');

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
            return {
              proj: obj.proj,
              name,
              root: target.root,
              cfgHash: receiver.cfgHash(name),
            };
          }
          if (root === null) {
            return {
              proj: obj.proj,
              name,
              cfgHash: receiver.cfgHash(name),
            };
          }
          const compiled = new CompiledPath(root);
          const p = compiled.build(target.context, target.param, ...pars);
          return {
            proj: obj.proj,
            name,
            root: p,
            cfgHash: receiver.cfgHash(name),
          };
        };
      case 'cfgHash':
        return (name) => {
          const reg = target.petri.retrieve(name);
          if (!reg) {
            logger.warn('Name for cfg not found', name);
            return undefined;
          }
          if (reg.option.cfg) {
            const cfgx = reg.option.cfg(obj.cfg);
            logger.silly('Excerpted cfg', cfgx);
            return hash(cfgx, true);
          }
          return undefined;
        };
      default:
        if (prop in obj) {
          return obj[prop];
        }
        return Reflect.get(target, prop, receiver);
    }
  },
});

const dispatch = async (payload, context, cust) => {
  const obj = petri.retrieve(payload.name);
  if (!obj) {
    logger.error('Name not found', payload.name);
    return false;
  }
  const { option } = obj;
  if (option.cfg) {
    const cfgx = option.cfg(context.cfg);
    logger.silly('Excerpted cfg', cfgx);
    const cfgHash = hash(cfgx, true);
    if (payload.cfgHash !== cfgHash) {
      logger.warn('cfgHash not match, drop payload', payload);
      return false;
    }
  }
  await petri.dispatch(payload, context, cust);
  return true;
};

const purgeVirtualQueue = async (context, cust) => {
  while (virtualQueue.length !== 0) {
    const evpld = virtualQueue.shift();
    logger.debug('Dispatching virtual payload', evpld);
    await dispatch(evpld, context, cust);
  }
};

module.exports.run = async (msg) => {
  if (msg.headers.kind === 'core') {
    const res = await processCore(msg.body);
    if (!res) {
      return;
    }
    const { proj } = res;
    const cfg = await etcd.get(`/${proj}/config`).json();
    const context = { proj, cfg };
    const cust = customizer(context);
    await purgeVirtualQueue(context, cust);
    return;
  }
  const id = msg.correlationId;
  if (!id) {
    logger.warn('correlation_id not found');
    return;
  }
  const { proj, name, root } = cIdParse(id);
  if (!proj || !name) {
    logger.warn('correlation_id malformed');
    return;
  }
  const payload = {
    id,
    name,
    proj,
    base: `/${proj}/state`,
    root,
    kind: msg.headers.kind,
    cfgHash: msg.headers.cfg,
    action: msg.body,
  };
  const cfg = await etcd.get(`/${proj}/config`).json();
  const context = { proj, cfg };
  const cust = customizer(context);
  logger.debug('Dispatching payload', payload);
  logger.silly('With config', cfg);
  await dispatch(payload, context, cust);
  await purgeVirtualQueue(context, cust);
};
