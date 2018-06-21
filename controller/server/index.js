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
