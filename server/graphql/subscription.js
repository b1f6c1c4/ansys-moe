const _ = require('lodash');
const { PubSub } = require('graphql-subscriptions');
const errors = require('./error');
const { Ballot } = require('../../models/ballots');
const { subscribe: rpcSubscribe } = require('../../rpc');
const { core } = require('../auth');
const throttle = require('./throttle');
const logger = require('../../logger')('graphql/subscription');

const pubsub = new PubSub();

const subsLib = new Map();

const lock = async (k, cb) => {
  const obj = subsLib.get(k);
  if (obj) {
    logger.debug('Subs cache hit', k);
    obj.num += 1;
    return;
  }
  logger.debug('Subs cache miss', k);
  const diss = await rpcSubscribe(k, cb);
  subsLib.set(k, {
    num: 1,
    diss,
  });
};

const unlock = (k) => {
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

const makeBallotSt = (key, data) => {
  const [status, owner, bId] = key.split('.');
  if (status !== 'status') {
    logger.error('Invalid routing key', key);
    throw new Error('Invalid routing key');
  }
  return {
    bId,
    owner,
    status: data,
  };
};

const makeVoterRg = (key, data) => {
  const [vreg, bId, iCode] = key.split('.');
  if (vreg !== 'vreg') {
    logger.error('Invalid routing key', key);
    throw new Error('Invalid routing key');
  }
  const { comment, publicKey } = JSON.parse(data);
  return {
    bId,
    iCode,
    comment,
    publicKey,
  };
};

const subscribeBallotStatus = async (bId) => {
  const k = `status.*.${bId}`;
  await lock(k, (key, res) => {
    logger.trace('Status data', res);
    const bSt = makeBallotSt(key, res);
    logger.debug('PubSub.publish', bSt);
    const pk = `ballotStatus.${bId}`;
    logger.debug('To', pk);
    pubsub.publish(pk, { ballotStatus: bSt });
  });
  return () => unlock(k);
};

const subscribeBallotsStatus = async (owner) => {
  const k = `status.${owner}.*`;
  await lock(k, (key, res) => {
    logger.trace('Status data', res);
    const bSt = makeBallotSt(key, res);
    logger.debug('PubSub.publish', bSt);
    const pk = `ballotsStatus.${owner}`;
    logger.debug('To', pk);
    pubsub.publish(pk, { ballotsStatus: bSt });
  });
  return () => unlock(k);
};

const subscribeVoterRegistered = async (bId) => {
  const k = `vreg.${bId}.*`;
  await lock(k, (key, res) => {
    logger.trace('Status data', res);
    const bSt = makeVoterRg(key, res);
    logger.debug('PubSub.publish', bSt);
    const pk = `voterRegistered.${bId}`;
    logger.debug('To', pk);
    pubsub.publish(pk, { voterRegistered: bSt });
  });
  return () => unlock(k);
};

module.exports = {
  subsLib,
  pubsub,
  lock,
  unlock,
  makeBallotSt,
  makeVoterRg,
  subscribeBallotStatus,
  subscribeBallotsStatus,
  subscribeVoterRegistered,

  onOperation(message, params, ws) {
    const opId = message.id;
    logger.debug('Operation', message);
    if (!ws.registry) {
      logger.debug('Assign registry to websocket');
      _.set(ws, 'registry', new Map());
    }
    const cred = _.get(params, 'variables.authorization');
    if (cred) {
      _.unset(params, 'variables.authorization');
      _.set(params, 'context.auth', core(cred));
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
      ballotStatus: {
        subscribe: async (parent, args, context) => {
          logger.debug('Subscription.ballotStatus.subscribe', args);
          logger.trace('parent', parent);
          logger.trace('context', context);

          const { bId } = args.input;

          try {
            await throttle('ballotStatus', 2, 1000)(context);

            const doc = await Ballot.findById(bId, { _id: 1 });
            if (!doc) {
              return new errors.NotFoundError();
            }

            const cb = await subscribeBallotStatus(bId);
            context.registry.set(context.opId, cb);

            return pubsub.asyncIterator(`ballotStatus.${bId}`);
          } catch (e) {
            if (e instanceof errors.TooManyRequestsError) return e;
            logger.error('Subscribe ballotStatus', e);
            return e;
          }
        },
      },
      ballotsStatus: {
        subscribe: async (parent, args, context) => {
          logger.debug('Subscription.ballotsStatus.subscribe', args);
          logger.trace('parent', parent);
          logger.trace('context', context);

          if (!_.get(context, 'auth.username')) {
            return new errors.UnauthorizedError();
          }

          const { username } = context.auth;

          try {
            await throttle('ballotsStatus', 1, 2000)(context);

            const cb = await subscribeBallotsStatus(username);
            context.registry.set(context.opId, cb);

            return pubsub.asyncIterator(`ballotsStatus.${username}`);
          } catch (e) {
            /* istanbul ignore else */
            if (e instanceof errors.TooManyRequestsError) return e;
            /* istanbul ignore next */
            logger.error('Subscribe ballotsStatus', e);
            /* istanbul ignore next */
            return e;
          }
        },
      },
      voterRegistered: {
        subscribe: async (parent, args, context) => {
          logger.debug('Subscription.voterRegistered.subscribe', args);
          logger.trace('parent', parent);
          logger.trace('context', context);

          if (!_.get(context, 'auth.username')) {
            return new errors.UnauthorizedError();
          }

          const { username } = context.auth;
          const { bId } = args.input;

          try {
            await throttle('voterRegistered', 2, 1000)(context);

            const doc = await Ballot.findById(bId, { _id: 1, status: 1, owner: 1 });
            if (!doc) {
              return new errors.NotFoundError();
            }
            if (doc.owner !== username) {
              return new errors.UnauthorizedError();
            }
            if (doc.status !== 'inviting') {
              return new errors.StatusNotAllowedError();
            }

            const cb = await subscribeVoterRegistered(bId);
            context.registry.set(context.opId, cb);

            return pubsub.asyncIterator(`voterRegistered.${bId}`);
          } catch (e) {
            if (e instanceof errors.TooManyRequestsError) return e;
            logger.error('Subscribe voterRegistered', e);
            return e;
          }
        },
      },
    },
  },
};
