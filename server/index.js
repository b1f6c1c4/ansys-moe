// const _ = require('lodash');
// const { PetriNet } = require('./petri');
// const EtcdAdapter = require('./adapter');
// const etcd = require('./etcd');
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

// const petri = new PetriNet(new EtcdAdapter(etcd.etcd));
// petri.register();

amqp.emitter.on('action', (msg) => {
  logger.info('Received message', msg.body);
  setTimeout(() => msg.obj.acknowledge(false), 1000);
  // petri.dispatch();
});

// etcd.connect();
amqp.connect();
