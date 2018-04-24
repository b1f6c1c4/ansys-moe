const _ = require('lodash');
const { createServer } = require('http');
const express = require('express');
const cors = require('cors');
const nocache = require('nocache');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { schema } = require('./graphql');
const etcd = require('./etcd');
const amqp = require('./amqp');
const core = require('./core');
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

const port = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: [
    process.env.CORS_ORIGIN,
    /^https?:\/\/localhost(:\d+)?$/,
  ],
  methods: ['HEAD', 'GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 300000,
}));

app.get('/', (req, res) => {
  logger.trace('GET /');
  if (status) {
    res.status(200).json(status);
  } else {
    res.status(500).send();
  }
});

app.post(
  '/graphql',
  nocache(),
  bodyParser.json(),
  bodyParser.text({
    type: 'application/graphql',
  }),
  (req, res, next) => {
    logger.info(`${req.method} /graphql`);
    if (req.is('application/graphql')) {
      req.body = { query: req.body };
    }
    next();
  },
  graphqlExpress({
    schema,
    tracing: process.env.NODE_ENV !== 'production',
    formatError: (err) => {
      const e = {
        message: err.message,
        statusCode: _.get(err, 'originalError.statusCode'),
        errorCode: _.get(err, 'originalError.errorCode'),
      };
      logger.trace('Return err', e);
      return e;
    },
  }),
);

app.get('/graphql', graphiqlExpress({
  endpointURL: '/graphql',
}));

app.use('/', (req, res) => res.status(404).send());

function runApp() {
  logger.debug('http.createServer ...');
  const server = createServer(app);
  server.listen(port, (err) => {
    if (err) {
      logger.fatalDie(err);
      return;
    }

    logger.info(`Server started localhost:${port}`);
  });
}

amqp.emitter.on('action', async (msg) => {
  let fin = () => msg.obj.acknowledge(false);
  try {
    const id = msg.correlationId;
    if (!id) {
      logger.warn('correlation_id not found');
      return;
    }
    const [proj, name, ...rest] = id.split('.');
    if (!proj || !name) {
      logger.warn('correlation_id malformed');
      return;
    }
    const payload = {
      name,
      base: `/${proj}/state`,
      root: rest.length === 0 ? undefined : `/${rest.join('/')}`,
      kind: msg.headers.kind,
      action: msg.body,
    };
    await core.channel.push({ payload, proj, fin });
    fin = undefined;
  } catch (e) {
    logger.error('Processing action', e);
  } finally {
    if (fin) {
      fin();
    }
  }
});

core.run();

const inits = [];
inits.push(amqp.connect());
inits.push(Promise.resolve(etcd.connect()));

Promise.all(inits)
  .then(runApp)
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });