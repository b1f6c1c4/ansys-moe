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
const etcd = require('../etcd');
const logger = require('../logger')('graphql/etcd');

module.exports = {
  resolvers: {
    Query: {
      async etcd(parent, args) {
        logger.trace('Query.etcd');

        const { prefix } = args;

        try {
          const { kvs } = await etcd.getAll().prefix(prefix || '').exec();
          logger.debug('Query etcd of length', kvs.length);
          return kvs;
        } catch (e) {
          logger.error('Query etcd', e);
          return e;
        }
      },
    },
  },
};
