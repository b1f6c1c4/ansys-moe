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
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const { dataPath, getRealFilePath, trim } = require('./common');
const logger = require('../logger')('file/delete');

module.exports = (router) => {
  router.delete('/', (req, res) => {
    logger.silly('Will delete directory', '*');
    rimraf(path.join(dataPath, '*'), (err) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      logger.debug('Delete directory', '*');
      res.status(204).send();
    });
  });

  router.delete(/^\/.*\/$/, (req, res) => {
    const fn = path.normalize(trim(req.path));
    const fullPath = getRealFilePath(fn);
    if (!fullPath) {
      logger.warn('Decline delete', req.path);
      res.status(403).send();
      return;
    }
    logger.silly('Will delete directory', fn);
    try {
      fs.lstat(fullPath, (err, r) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.status(404).send();
          }
          res.status(500).send(err);
          return;
        }
        if (!r.isDirectory()) {
          res.redirect(307, `/${fn}`);
        } else {
          rimraf(fullPath, { glob: false }, (err2) => {
            if (err2) {
              res.status(500).send(err2);
              return;
            }
            logger.debug('Delete directory', fn);
            res.status(204).send();
          });
        }
      });
    } catch (e) {
      logger.error('Delete directory', e);
      res.status(500).send();
    }
  });

  router.delete(/^\/.*[^/]$/, (req, res) => {
    const fn = path.normalize(trim(req.path));
    const fullPath = getRealFilePath(fn);
    if (!fullPath) {
      logger.warn('Decline delete', req.path);
      res.status(403).send();
      return;
    }
    logger.silly('Will delete file', fn);
    try {
      fs.unlink(fullPath, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.status(404).send();
          } else if (err.code === 'EISDIR') {
            res.redirect(307, `/${fn}/`);
          } else {
            res.status(500).send(err);
          }
          return;
        }
        res.status(204).send();
      });
    } catch (e) {
      logger.error('Delete file', e);
      res.status(500).send();
    }
  });
};
