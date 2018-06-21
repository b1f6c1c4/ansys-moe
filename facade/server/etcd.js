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
const { Etcd3, PutBuilder } = require('etcd3');
const logger = require('./logger')('etcd');

PutBuilder.prototype.json = function json(obj) {
  return this.value(JSON.stringify(obj));
};

let client;
const connect = () => {
  const raw = JSON.parse(process.env.ETCD_ENDPOINTS || '["localhost:2379"]');
  const endpoints = raw.map((r) => r.startsWith('http') ? r : `http://${r}`);
  logger.debug('Etcd endpoints', endpoints);

  client = new Etcd3({
    hosts: endpoints,
  });
};

module.exports = new Proxy({}, {
  get(target, propKey) {
    if (propKey === 'connect') {
      return connect;
    }
    return client[propKey];
  },
});
