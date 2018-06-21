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
const amqp = require('../amqp');
const expression = require('./expression');
const python = require('./python');
const rlang = require('./rlang');
const mma = require('./mma');
const { cIdGen } = require('../util');
const logger = require('../logger')('integration');

module.exports.run = (kind, code, variables, info) => {
  logger.debug(`Run integration ${kind}`, info);
  const id = cIdGen(info);
  switch (kind) {
    case 'expression':
      amqp.publish('action', expression.wrapped(code, variables), id, {
        kind: 'expression',
        cfg: info.cfgHash,
      });
      break;
    case 'python':
      amqp.publish(kind, python.run(code, variables), id, {
        cfg: info.cfgHash,
      });
      break;
    case 'rlang':
      amqp.publish(kind, rlang.run(code, variables), id, {
        cfg: info.cfgHash,
      });
      break;
    case 'mathematica':
      amqp.publish(kind, mma.run(code, variables), id, {
        cfg: info.cfgHash,
      });
      break;
    default:
      amqp.publish('action', { type: 'failure', result: 'Kind not supported' }, {
        kind,
        cfgHash: info.cfgHash,
      });
      break;
  }
};

module.exports.cancel = (kind, info) => {
  amqp.cancel(kind, cIdGen(info));
};

module.exports.parse = ({ kind, action }, ...args) => {
  logger.trace(`Parse integration ${kind}`, action);
  switch (kind) {
    case 'expression':
      return action.type === 'done' ? action.result : null;
    case 'python':
      return python.parse(action, ...args);
    case 'rlang':
      return rlang.parse(action, ...args);
    case 'mathematica':
      return mma.parse(action, ...args);
    default:
      logger.error('Kind not supported', kind);
      return null;
  }
};
