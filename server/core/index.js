const _ = require('lodash');
const Channel = require('@nodeguy/channel');
const etcd = require('../etcd');
const { PetriNet, CompiledPath } = require('../petri');
const EtcdAdapter = require('../adapter');
const { virtualQueue } = require('../integration');
const logic = require('./logic');
const logger = require('../logger')('core');

const channel = new Channel();

const petri = new PetriNet(new EtcdAdapter(etcd));
logic(petri);

const customizer = (obj) => (proxy) => new Proxy(proxy, {
  get(target, prop, receiver) {
    const retriver = (key, ...pars) => {
      const compiled = new CompiledPath(key);
      const p = compiled.build(target.context, target.param, ...pars);
      return etcd.get(p);
    };
    switch (prop) {
      case 'retriveJson':
        return (...args) => retriver(...args).json();
      case 'retriveNumber':
        return (...args) => retriver(...args).number();
      case 'retriveString':
        return (...args) => retriver(...args).string();
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
      default:
        if (prop in obj) {
          return obj[prop];
        }
        return Reflect.get(target, prop, receiver);
    }
  },
});

module.exports.channel = channel;

module.exports.run = async () => {
  for (;;) {
    const obj = await channel.shift();
    try {
      const { payload, proj } = obj;
      const cfg = await etcd.get(`/${proj}/config`).json();
      const context = { proj };
      const cust = customizer({ proj, cfg });
      logger.info('Dispatching payload', payload);
      logger.debug('With config', cfg);
      await petri.dispatch(payload, context, cust);
      while (virtualQueue.length !== 0) {
        const evpld = virtualQueue.shift();
        logger.info('Dispatching eval payload', evpld);
        await petri.dispatch(evpld, context, cust);
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
