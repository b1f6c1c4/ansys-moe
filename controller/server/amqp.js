/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const _ = require('lodash');
const amqp = require('amqp');
const EventEmitter = require('events');
const status = require('./status');
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
      if (correlationId) {
        logger.trace(`Received message #${correlationId} of kind ${headers.kind}`, body);
      } else {
        logger.trace(`Received message kind ${headers.kind}`, body);
      }
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
    clientProperties: {
      product: 'controller',
      platform: 'nodejs',
      version: status ? status.version : '',
    },
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

const publish = (queue, body, id, headers) => {
  logger.trace(`Publish #${id} to ${queue}`, body);
  connection.publish(queue, JSON.stringify(body), {
    mandatory: true,
    contentType: 'application/json',
    deliveryMode: 2,
    correlationId: id,
    headers: _.omitBy(headers, _.isNil),
  });
};

const cancel = (kind, id) => {
  logger.trace(`Cancel ${kind} #${id}`);
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
