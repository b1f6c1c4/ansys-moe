const { createServer } = require('http');
const express = require('express');
const { graphiqlExpress } = require('apollo-server-express');
// const { makeServer } = require('./app/graphql');
const mongo = require('./mongo');
const status = require('./status');
const logger = require('./logger')('index');

logger.info('Versions', process.versions);

process.on('unhandledRejection', (e) => {
  logger.fatal('Unhandled rejection', e);
  throw e;
});

process.on('uncaughtException', (e) => {
  logger.fatalDie('Uncaught exception', e);
});

process.on('warning', (e) => {
  logger.warn('Node warning', e);
});

process.on('SIGINT', () => {
  logger.fatalDie('SIGINT received');
});

process.on('SIGTERM', () => {
  logger.fatalDie('SIGTERM received');
});

const app = express();

app.set('trust proxy', true);
app.get('/', (req, res) => res.json(status));
// app.use('/api', api, (req, res) => res.status(404).send());

const port = parseInt(process.env.PORT || '3000', 10);

if (process.env.NODE_ENV !== 'production') {
  app.get('/graphql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `ws://localhost:${port}/subscriptions`,
  }));
}

function runApp() {
  logger.debug('http.createServer ...');
  const server = createServer(app);
  server.listen(port, (err) => {
    if (err) {
      logger.fatalDie(err);
      return undefined;
    }

    // Add websocket
    // const ws = makeServer(server);

    logger.info(`Server started localhost:${port}`);

    return undefined; // return ws;
  });
}

const inits = [];
inits.push(mongo.connect());

Promise.all(inits)
  .then(runApp)
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });
