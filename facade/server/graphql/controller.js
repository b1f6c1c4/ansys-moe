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
const Docker = require('dockerode');
const os = require('os');
const logger = require('../logger')('graphql/controller');

const docker = new Docker();

module.exports = {
  resolvers: {
    Query: {
      async controller() {
        logger.trace('Query.controller');

        try {
          const me = docker.getContainer(os.hostname());
          const data = await me.inspect();
          const project = data.Config.Labels['com.docker.compose.project'];
          const list = await docker.listContainers({
            filters: {
              label: [
                `com.docker.compose.project=${project}`,
                'com.docker.compose.service=controller',
              ],
            },
          });
          return !!list.length;
        } catch (e) {
          logger.error('Query controller', e);
          return e;
        }
      },
    },
    Mutation: {
      async startController() {
        logger.trace('Mutation.startController');

        try {
          logger.info('Request to startController');
          const me = docker.getContainer(os.hostname());
          const data = await me.inspect();
          const project = data.Config.Labels['com.docker.compose.project'];
          const list = await docker.listContainers({
            all: true,
            filters: {
              label: [
                `com.docker.compose.project=${project}`,
                'com.docker.compose.service=controller',
              ],
            },
          });
          if (!list.length) {
            return false;
          }
          await Promise.all(list.map(async ({ Id }) => {
            const dk = await docker.getContainer(Id);
            await dk.start();
          }));
          return true;
        } catch (e) {
          logger.error('Mutation startController', e);
          return e;
        }
      },
    },
  },
};
