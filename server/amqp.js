const amqp = require('amqp');
const EventEmitter = require('events');
const logger = require('./logger')('amqp');

let connection;
let mExchange;
const emitter = new EventEmitter();

const makeQueueStatus = () => new Promise((resolve) => {
  connection.queue('', {
    durable: false,
    exclusive: true,
    autoDelete: true,
    noDeclare: false,
    closeChannelOnUnsubscribe: true,
  }, (q) => {
    logger.debug('Status q.bind...');
    q.bind(mExchange, 'status.#');
    logger.debug('Status q.subscribe...');
    q.subscribe({
      routingKeyInPayload: true,
    }, (msg) => {
      emitter.emit('status', msg);
    });
    logger.info(`Status queue ${q.name} ready`);
    resolve();
  });
});

const makeQueueLog = () => new Promise((resolve) => {
  connection.queue('', {
    durable: false,
    exclusive: true,
    autoDelete: true,
    noDeclare: false,
    closeChannelOnUnsubscribe: true,
  }, (q) => {
    logger.debug('Log q.bind...');
    q.bind(mExchange, 'log.#');
    logger.debug('Log q.subscribe...');
    q.subscribe({
      routingKeyInPayload: true,
    }, (msg) => {
      emitter.emit('log', msg);
    });
    logger.info(`Log queue ${q.name} ready`);
    resolve();
  });
});

const makeExchangeM = () => new Promise((resolve) => {
  connection.exchange('monitor', {
    type: 'topic',
    durable: false,
    autoDelete: false,
    noDeclare: false,
  }, (ex) => {
    logger.debug('Exchange created');
    mExchange = ex;
    resolve();
  });
});

const connect = () => new Promise((resolve, reject) => {
  logger.info('Connecting AMQP...');
  logger.debug('AMQP host', process.env.RABBIT_HOST);
  logger.debug('AMQP port', process.env.RABBIT_PORT);
  logger.debug('AMQP user', process.env.RABBIT_USER);
  connection = amqp.createConnection({
    host: process.env.RABBIT_HOST || 'localhost',
    port: process.env.RABBIT_PORT || 5672,
    login: process.env.RABBIT_USER || 'guest',
    password: process.env.RABBIT_PASS || 'guest',
  });

  connection.on('error', (e) => {
    logger.error('AMQP error', e);
  });

  connection.on('ready', () => {
    logger.info('AMQP connection ready');

    makeExchangeM()
      .then(() => {
        Promise.all([makeQueueStatus(), makeQueueLog()])
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
});

module.exports = {
  connect,
  emitter,
};
