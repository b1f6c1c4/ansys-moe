const amqp = require('../amqp');
const logger = require('../logger')('graphql/mutation');

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
