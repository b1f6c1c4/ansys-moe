const { createServer } = require('http');
const websocket = require('ws');
const amqp = require('./amqp');
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

const app = (req, res) => {
  if (req.url !== '/') {
    res.statusCode = 404;
    res.end();
    return;
  }
  if (status) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status));
  } else {
    res.statusCode = 500;
    res.end();
  }
};

function runApp() {
  logger.debug('http.createServer ...');
  const server = createServer(app);
  server.listen(port, (err) => {
    if (err) {
      logger.fatalDie(err);
      return;
    }

    const wss = new websocket.Server({
      path: '/',
      server,
    });
    wss.broadcast = (data) => {
      wss.clients.forEach((client) => {
        if (client.readyState === websocket.OPEN) {
          client.send(data);
        }
      });
    };

    logger.info(`Server started localhost:${port}`);
  });
}

const inits = [];
if (!process.env.NO_RABBIT) {
  inits.push(amqp.connect()
    .then(() => {
      logger.info('Rabbitmq connected.');
    }));
} else {
  logger.warn('Rabbitmq omitted.');
}

Promise.all(inits)
  .then(runApp)
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });
