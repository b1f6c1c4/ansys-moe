const { PetriNet } = require('./petri');
const EtcdAdapter = require('./adapter');
const etcd = require('./etcd');
const amqp = require('./amqp');
const core = require('./core');
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

const petri = new PetriNet(new EtcdAdapter(etcd.etcd));
core(petri);

amqp.emitter.on('action', (msg) => {
  logger.info('Received message', msg.body);
  const id = msg.correlationId;
  const index = id.indexOf(':');
  petri.dispatch({
    name: id.substr(0, index),
    base: `${id.substr(index - 1)}/state`,
    kind: msg.headers.kind,
    action: msg.body,
  }).then(() => msg.obj.acknowledge(false));
});

etcd.connect();
amqp.connect();
