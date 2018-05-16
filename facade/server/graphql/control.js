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
