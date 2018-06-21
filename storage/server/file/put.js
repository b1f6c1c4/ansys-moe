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
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const { getRealFilePath, trim } = require('./common');
const contentstream = require('../utils/contentstream');
const logger = require('../logger')('file/put');

module.exports = (router) => {
  router.put(/^\/.*[^/]$/, (req, res) => {
    const fn = path.normalize(trim(req.path));
    const fullPath = getRealFilePath(fn);
    if (!fullPath) {
      logger.warn('Declined file', req.path);
      res.status(403).send();
      return;
    }
    logger.silly('Will store file', fn);
    try {
      shell.mkdir('-p', path.dirname(fullPath));
      const f = fs.createWriteStream(fullPath);
      f.on('error', (e) => {
        logger.error('createWriteStream', e);
        res.status(500).send();
      });
      const c = contentstream(req, () => {}, true);
      c.on('error', (e) => {
        logger.error('contentsteram', e);
        res.status(500).send();
      });
      c.pipe(f).on('finish', () => {
        logger.debug('Store file succeed', fn);
        res.status(204).send();
      });
    } catch (e) {
      logger.error('Store file', e);
      res.status(500).send(e);
    }
  });
};
