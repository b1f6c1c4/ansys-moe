const { createServer } = require('http');
const express = require('express');
const cors = require('cors');
const status = require('./status');
const file = require('./file');
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

app.use('/storage', file);

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

const inits = [];

Promise.all(inits)
  .then(runApp)
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });
