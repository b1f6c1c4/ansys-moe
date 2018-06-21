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
const amqp = require('../amqp');
const logger = require('../logger')('graphql/core');

module.exports = {
  resolvers: {
    Mutation: {
      async run(parent, args) {
        logger.trace('Mutation.run');

        const { name, config } = args;

        try {
          logger.info(`Request to run ${name}`, config);
          amqp.publish('action', {
            type: 'run',
            name,
            config,
          });
          return true;
        } catch (e) {
          logger.error('Mutation run', e);
          return e;
        }
      },
    },
  },
};
