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

const petri = new PetriNet(new EtcdAdapter(etcd));
core(petri);

amqp.emitter.on('action', async (msg) => {
  const id = msg.correlationId;
  logger.info(`Received message ${msg.kind} ${id}`, msg.body);
  if (!id) {
    logger.warn('correlation_id not found');
    msg.obj.acknowledge(false);
    return;
  }
  const index = id.indexOf('.');
  const ac = {
    name: id.substr(index + 1),
    base: `/${id.substr(0, index)}/state`,
    kind: msg.headers.kind,
    action: msg.body,
  };
  logger.info('Dispatching action', ac);
  try {
    await petri.dispatch(ac);
  } catch (e) {
    logger.error('Dispatching action', e);
  }
  msg.obj.acknowledge(false);
  logger.warn('Current state', etcd.mock());
});

etcd.connect();
amqp.connect();
