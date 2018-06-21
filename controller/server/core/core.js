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
const etcd = require('../etcd');
const logger = require('../logger')('core/core');

module.exports = async (action) => {
  const { type, name: proj, config } = action;
  if (type !== 'run') {
    logger.error('Type not supported', type);
    return undefined;
  }
  logger.warn(`Creating project ${proj}`, config);
  // TODO: don't purge everything
  await etcd.delete().prefix(`/p/${proj}`).exec();
  await etcd.put(`/p/${proj}/config`).json(config).exec();
  return {
    name: 'init',
    proj,
    base: `/p/${proj}/state`,
  };
};
