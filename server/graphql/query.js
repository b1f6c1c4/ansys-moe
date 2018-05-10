const logger = require('../logger')('graphql/query');

module.exports = {
  resolvers: {
    Query: {
      async etcd(parent, args) {
        logger.debug('Query etcd', args);

        const { prefix } = args;

        try {
          // TODO
          return [];
        } catch (e) {
          logger.error('Query etcd', e);
          return e;
        }
      },
    },
  },
};
