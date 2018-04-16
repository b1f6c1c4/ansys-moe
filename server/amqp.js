const amqp = require('amqp');
const EventEmitter = require('events');
const logger = require('./logger')('amqp');

let connection;
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
    q.subscribe((msg) => {
      try {
        emitter.emit('action', msg);
      } catch (e) {
        logger.error('Emitting action', e);
      }
    });
    logger.info('Action queue ready');
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

    Promise.all([makeQueueAction()])
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

module.exports = {
  connect,
  emitter,
  publish,
};
