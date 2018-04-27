const _ = require('lodash');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const fs = require('fs');
const etcd = require('../etcd');
const core = require('../core');
const status = require('../status');
const logger = require('../logger')('graphql');

const typeDefs = fs.readFileSync(path.join(__dirname, '../../docs/public.graphql'), 'utf8');

const resolvers = {
  Query: {
    status: () => status,
  },
  Mutation: {
    async run(parent, { name: proj, config: cfg }) {
      logger.info(`Creating project ${proj}`, cfg);
      await etcd.put(`/${proj}/config`).json(cfg).exec();
      const payload = {
        name: 'init',
        base: `/${proj}/state`,
      };
      await core.channel.push({ payload, proj });
      return true;
    },

    async setConcurrent(parent, { name: proj, concurrent }) {
      logger.info(`Set ${proj}/concurrent`, concurrent);
      await etcd.put(`/${proj}/concurrent`).value(concurrent).exec();
      const payload = {
        name: 'i-new-req',
        base: `/${proj}/state`,
      };
      await core.channel.push({ payload, proj });
      return true;
    },
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: _.merge(
    resolvers,
  ),
});

module.exports = {
  resolvers,
  schema,
};
