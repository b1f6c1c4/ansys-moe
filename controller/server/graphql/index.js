const _ = require('lodash');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const fs = require('fs');
const status = require('../status');

const projs = require('./projection').resolvers;

/* istanbul ignore next */
const typeDefs = fs.readFileSync(path.join(__dirname, '../../docs/public.graphql'), 'utf8');

const resolvers = {
  Query: {
    status: () => status,
  },
};

/* istanbul ignore next */
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: _.merge(
    resolvers,
    projs,
  ),
});

module.exports = {
  resolvers,
  schema,
};
