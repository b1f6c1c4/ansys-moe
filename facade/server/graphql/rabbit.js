/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
    Mutation: {
      async purgeQueues() {
        logger.trace('Query.purgeQueues');

        try {
          const queues = [
            'action',
            'ansys',
            'python',
            'rlang',
            'mathematica',
          ];
          await Promise.all(queues.map((q) => {
            logger.warn(`Purge ${q} as required`);
            return rabbit.delete(`/api/queues/%2f/${q}/contents`);
          }));
          return true;
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
