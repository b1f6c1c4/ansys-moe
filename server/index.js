// const _ = require('lodash');
const etcd = require('./etcd');
const amqp = require('./amqp');
require('./status');
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

amqp.emitter.on('action', (msg) => {
  logger.info('Received message', msg);
});

etcd.connect();
amqp.connect();
