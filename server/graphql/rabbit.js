const _ = require('lodash');
const axios = require('axios');
const logger = require('../logger')('graphql/rabbit');

logger.debug('Rabbit mgmt port', process.env.RABBIT_MGMT_PORT);
const rabbit = axios.create({
  baseURL: `http://${process.env.RABBIT_HOST || 'localhost'}:${process.env.RABBIT_MGMT_PORT || 15672}`,
  auth: {
    username: process.env.RABBIT_USER || 'guest',
    password: process.env.RABBIT_PASS || 'guest',
  },
});

module.exports = {
  resolvers: {
    Query: {
      async rabbit() {
        logger.trace('Query.rabbit');

        try {
          const { data: queues } = await rabbit.get('/api/queues/%2f');
          const { data: consumers } = await rabbit.get('/api/consumers/%2f');
          const q = _.mapValues(_.groupBy(queues, 'name'), 0);
          const c = _.mapValues(_.groupBy(consumers, 'queue.name'), (cs) => ({
            prefetches: _.chain(cs)
              .map('prefetch_count')
              .map((v) => v === 0 ? Infinity : v)
              .sum()
              .value(),
          }));
          return _.merge(q, c);
        } catch (e) {
          logger.error('Query rabbit', e);
          return e;
        }
      },
    },
    QueueStatus: {
      ready: (parent) => _.get(parent, ['messages_ready']),
      unacked: (parent) => _.get(parent, ['messages_unacknowledged']),
      prefetches: (parent) => _.get(parent, ['prefetches'], 0),
    },
  },
};
