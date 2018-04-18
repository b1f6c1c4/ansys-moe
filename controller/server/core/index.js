const _ = require('lodash');
const Channel = require('@nodeguy/channel');
const etcd = require('../etcd');
const { PetriNet } = require('../petri');
const EtcdAdapter = require('../adapter');
const { virtualQueue } = require('../integration');
const logic = require('./logic');
const logger = require('../logger')('core');

const channel = new Channel();

const petri = new PetriNet(new EtcdAdapter(etcd));
logic(petri);

module.exports.channel = channel;

module.exports.run = async () => {
  for (;;) {
    const obj = await channel.shift();
    try {
      const { payload, proj } = obj;
      const cfg = await etcd.get(`/${proj}/config`).json();
      logger.info('Dispatching payload', payload);
      logger.debug('With config', cfg);
      await petri.dispatch(payload, proj, cfg);
      while (virtualQueue.length !== 0) {
        const evpld = virtualQueue.shift();
        logger.info('Dispatching eval payload', evpld);
        await petri.dispatch(evpld, proj, cfg);
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
