const etcd = require('../etcd');
const logger = require('../logger')('graphql/query');

module.exports = {
  resolvers: {
    Query: {
      async etcd(parent, args) {
        logger.debug('Query.etcd', args);

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
