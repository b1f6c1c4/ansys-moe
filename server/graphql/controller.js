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
