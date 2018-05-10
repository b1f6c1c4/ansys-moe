const _ = require('lodash');
const { PubSub } = require('graphql-subscriptions');
const etcd = require('../etcd');
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
  logger.info('Start etcd watch', k);
  const watcher = await etcd.watch().prefix(k).create();
  watcher.on('put', (r) => cb('put', r));
  watcher.on('delete', (r) => cb('delete', r));
  subsLib.set(k, {
    num: 1,
    diss: () => { watcher.cancel(); },
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
  logger.info('Stop etcd watch', k);
  obj.diss();
  subsLib.delete(k);
};

const subscribeEtcd = async (prefix) => {
  const k = prefix;
  await lock(k, (kind, res) => {
    logger.silly(`Etcd ${kind}`, res);
    const bSt = { ...res };
    if (kind === 'delete') {
      bSt.value = null;
    }
    pubsub.publish(prefix, { watchEtcd: bSt });
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
