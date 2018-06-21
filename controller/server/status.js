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
const logger = require('./logger')('status');
const fs = require('fs');

let status;
try {
  logger.trace('Read VERSION.json');
  status = JSON.parse(fs.readFileSync('VERSION.json', 'utf8'));
  logger.info('Status', status);
} catch (e) {
  logger.warn('Reading VERSION.json', e);
}

module.exports = status;
