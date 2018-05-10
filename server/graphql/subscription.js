const _ = require('lodash');
const { PubSub } = require('graphql-subscriptions');
const logger = require('../logger')('graphql/subscription');

const pubsub = new PubSub();

const subsLib = new Map();

const lock = async (k, cb) => {
  logger.silly('Will lock', k);
  const obj = subsLib.get(k);
  if (obj) {
    logger.debug('Subs cache hit', k);
    obj.num += 1;
    return;
  }
  logger.debug('Subs cache miss', k);
  const diss = () => cb; // TODO: call etcd.watch
  subsLib.set(k, {
    num: 1,
    diss,
  });
};

const unlock = (k) => {
  logger.silly('Will unlock', k);
  const obj = subsLib.get(k);
  if (!obj) {
    logger.warn('Subs not found', k);
    return;
  }
  obj.num -= 1;
  if (obj.num > 0) {
    logger.debug('Subs cache diss', k);
    return;
  }
  logger.debug('Dismiss', k);
  obj.diss();
  subsLib.delete(k);
};

const subscribeEtcd = async (prefix) => {
  const k = prefix;
  await lock(k, (key, res) => {
    logger.silly('Status data', res);
    const bSt = {}; // TODO: parse data
    logger.trace('PubSub.publish', bSt);
    pubsub.publish(prefix, { etcd: bSt });
  });
  return () => unlock(k);
};

module.exports = {

  onOperation(message, params, ws) {
    const opId = message.id;
    logger.debug('Operation', message);
    if (!ws.registry) {
      logger.debug('Assign registry to websocket');
      _.set(ws, 'registry', new Map());
    }
    _.set(params, 'context.registry', ws.registry);
    _.set(params, 'context.opId', opId);
    return params;
  },

  onOperationComplete(ws, opId) {
    logger.debug('Operation complete', opId);
    if (!ws.registry) {
      logger.warn('No registry found');
      return;
    }
    const cb = ws.registry.get(opId);
    if (!_.isFunction(cb)) {
      logger.warn('Callback is not function', cb);
      return;
    }
    cb();
  },

  resolvers: {
    Subscription: {
      watchEtcd: {
        subscribe: async (parent, args, context) => {
          logger.debug('Subscription.watchEtcd.subscribe', args);

          const { prefix } = args;

          try {
            const cb = await subscribeEtcd(prefix || '');
            context.registry.set(context.opId, cb);

            return pubsub.asyncIterator(prefix || '');
          } catch (e) {
            logger.error('Subscribe watchEtcd', e);
            return e;
          }
        },
      },
    },
  },
};
