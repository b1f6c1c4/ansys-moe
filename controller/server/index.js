const etcd = require('./etcd');
const amqp = require('./amqp');
const core = require('./core');
const logger = require('./logger')('index');

logger.info('Versions', process.versions);

process.on('unhandledRejection', (e) => {
  logger.fatalDie('Unhandled rejection', e);
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

amqp.emitter.on('action', (msg) => {
  try {
    core.run(msg)
      .then(() => msg.obj.acknowledge(false))
      .catch((e) => {
        logger.fatalDie('Processing action', e);
      });
  } catch (e) {
    logger.fatalDie('Processing action', e);
  }
});

const inits = [];
inits.push(amqp.connect());
inits.push(Promise.resolve(etcd.connect()));

Promise.all(inits)
  .then(() => {
    logger.info('Init succeed');
  })
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });
