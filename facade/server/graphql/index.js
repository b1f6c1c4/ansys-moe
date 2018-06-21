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
const _ = require('lodash');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const fs = require('fs');
const status = require('../status');

const core = require('./core').resolvers;
const etcd = require('./etcd').resolvers;
const rabbit = require('./rabbit').resolvers;
const control = require('./control').resolvers;
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
    rabbit,
    control,
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
