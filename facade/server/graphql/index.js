const _ = require('lodash');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const fs = require('fs');
const status = require('../status');

const core = require('./core').resolvers;
const etcd = require('./etcd').resolvers;
const controller = require('./controller').resolvers;
const {
  onOperation,
  onOperationComplete,
  resolvers: subscription,
} = require('./subscription');

const typeDefs = fs.readFileSync(path.join(__dirname, '../../docs/public.graphql'), 'utf8');
const resolvers = {
  Query: {
    status: () => status,
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: _.merge(
    resolvers,
    core,
    etcd,
    controller,
    subscription,
  ),
});

module.exports = {
  resolvers,
  schema,
  makeServer: (server) => new SubscriptionServer({
    execute,
    subscribe,
    schema,
    onOperation,
    onOperationComplete,
    keepAlive: 5000,
  }, {
    server,
    path: '/subscriptions',
  }),
};
