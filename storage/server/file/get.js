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
const path = require('path');
const fs = require('fs');
const async = require('async');
const archiver = require('archiver');
const { getRealFilePath, trim } = require('./common');
const logger = require('../logger')('file/get');

module.exports = (router) => {
  router.get(/\/$/, (req, res) => {
    const fn = path.normalize(trim(req.path));
    logger.silly('Will list or download directory', fn);
    const fullPath = getRealFilePath(fn);
    if (!fullPath) {
      logger.warn('Declined directory', req.path);
      res.status(403).send();
      return;
    }
    switch (req.accepts(['application/zip', 'application/json'])) {
      case 'application/zip': {
        const archive = archiver('zip');

        archive.on('error', (err) => {
          logger.error('Download directory', err);
          res.status(500).send(err);
        });

        archive.on('end', () => {
          logger.info('Downloaded directory', fn);
        });

        let stem;
        if (fn === '.') {
          stem = 'storage';
        } else {
          stem = path.basename(fn);
        }
        res.attachment(`${stem}.zip`);
        archive.pipe(res);
        logger.trace('Prepare downloading directory', fn);
        archive.directory(fullPath, stem);
        archive.finalize();
        break;
      }
      case 'application/json':
        fs.readdir(fullPath, (err, files) => {
          if (err) {
            if (err.code === 'ENOENT') {
              res.status(404).send();
            } else {
              logger.error('List directory', err);
              res.status(500).send(err);
            }
            return;
          }
          async.mapLimit(files.map((f) => path.join(fullPath, f)), 10, fs.lstat, (err2, results) => {
            if (err2) {
              logger.error('List directory', err2);
              res.status(500).send(err2);
            } else {
              logger.debug('List directory succeed', fn);
              res.status(200).json(_.zipWith(files, results, (f, r) => ({
                name: f,
                dir: r.isDirectory(),
                size: r.size,
                createdAt: r.birthtimeMs,
                updatedAt: r.mtimeMs,
              })));
            }
          });
        });
        break;
      default:
        res.status(406).send();
        break;
    }
  });
};
