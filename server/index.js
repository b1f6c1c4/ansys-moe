const etcd = require('./etcd');
const amqp = require('./amqp');
const core = require('./core');
const { cIdParse } = require('./util');
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

amqp.emitter.on('action', async (msg) => {
  let fin = () => msg.obj.acknowledge(false);
  try {
    const id = msg.correlationId;
    if (!id) {
      logger.warn('correlation_id not found');
      return;
    }
    const { proj, name, root } = cIdParse(id);
    if (!proj || !name) {
      logger.warn('correlation_id malformed');
      return;
    }
    const payload = {
      id,
      name,
      base: `/${proj}/state`,
      root,
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
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });
