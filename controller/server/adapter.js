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

class EtcdAdapter {
  constructor(etcd) {
    this.etcd = etcd;
  }

  async get(key) {
    return this.etcd.get(key).number();
  }

  async set(key, value) {
    return this.etcd.put(key).value(value).exec();
  }

  async setMultiple(obj) {
    const sets = _.toPairs(obj);
    while (sets.length) {
      await this.etcd.stm().transact((tx) => Promise.all(
        sets.splice(0, 128).map(([key, value]) => tx.put(key).value(value)),
      ));
    }
  }
}

module.exports = EtcdAdapter;
