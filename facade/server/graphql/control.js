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
const logger = require('../logger')('graphql/control');

module.exports = {
  resolvers: {
    Mutation: {
      async stopProj(parent, args) {
        logger.trace('Mutation.stopProj', args);

        const { proj } = args;

        try {
          await etcd.put(`/p/${proj}/state/error`).value(1).exec();
          logger.info(`Proj ${proj} force stopped`);
          return true;
        } catch (e) {
          logger.error('Mutation stopProj', e);
          return e;
        }
      },

      async stopCat(parent, args) {
        logger.trace('Mutation.stopCat', args);

        const { proj, cHash } = args;

        try {
          await etcd.put(`/p/${proj}/state/cat/${cHash}/error`).value(1).exec();
          logger.info(`Cat ${proj}/${cHash} force stopped`);
          return true;
        } catch (e) {
          logger.error('Mutation stopCat', e);
          return e;
        }
      },

      async stopEval(parent, args) {
        logger.trace('Mutation.stopEval', args);

        const { proj, cHash, dHash } = args;

        try {
          await etcd.put(`/p/${proj}/state/cat/${cHash}/eval/${dHash}/error`).value(1).exec();
          logger.info(`Eval ${proj}/${cHash}/${dHash} force stopped`);
          return true;
        } catch (e) {
          logger.error('Mutation stopEval', e);
          return e;
        }
      },

      async dropProj(parent, args) {
        logger.trace('Mutation.dropProj', args);

        const { proj } = args;

        try {
          await etcd.delete().prefix(`/p/${proj}`).exec();
          logger.info(`Proj ${proj} force dropped`);
          return true;
        } catch (e) {
          logger.error('Mutation dropProj', e);
          return e;
        }
      },
    },
  },
};
