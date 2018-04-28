const amqp = require('amqp');
const EventEmitter = require('events');
const logger = require('./logger')('amqp');

let connection;
let cExchange;
const emitter = new EventEmitter();

const makeQueueAction = () => new Promise((resolve) => {
  connection.queue('action', {
    durable: true,
    exclusive: false,
    autoDelete: false,
    noDeclare: false,
    closeChannelOnUnsubscribe: false,
  }, (q) => {
    logger.debug('Action q.bind...');
    q.bind('#');
    logger.debug('Action q.subscribe...');
    q.subscribe({ ack: true }, (body, headers, { correlationId }, obj) => {
      logger.debug(`Received message #${correlationId}`, body);
      try {
        emitter.emit('action', {
          correlationId,
          headers,
          body,
          obj,
        });
      } catch (e) {
        logger.error('Emitting action', e);
      }
    });
    logger.info('Action queue ready');
    resolve();
  });
});

const makeExchangeC = () => new Promise((resolve) => {
  cExchange = connection.exchange('cancel', {
    type: 'topic',
    durable: false,
    autoDelete: false,
    noDeclare: false,
  });
  logger.debug('C exchange created');
  resolve();
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
    heartbeat: 5,
  });

  connection.on('error', (e) => {
    logger.error('AMQP error', e);
  });

  connection.on('ready', () => {
    logger.info('AMQP connection ready');

    makeExchangeC()
      .then(makeQueueAction)
      .then(resolve)
      .catch(reject);
  });
});

const publish = (queue, body, id) => {
  logger.info(`Publish #${id} to ${queue}`, body);
  connection.publish(queue, JSON.stringify(body), {
    mandatory: true,
    contentType: 'application/json',
    deliveryMode: 2,
    correlationId: id,
  });
};

const cancel = (kind, id) => {
  logger.info(`Cancel ${kind} #${id}`);
  cExchange.publish(`cancel.${kind}.${id}`, '{}', {
    mandatory: false,
    contentType: 'application/json',
    deliveryMode: 1,
  });
};

module.exports = {
  connect,
  emitter,
  publish,
  cancel,
};
