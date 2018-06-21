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
const async = require('async');
const { getRealFilePath, trim } = require('./common');
const logger = require('../logger')('file/move');

const safeLstat = (...args) => {
  const pars = args.splice(0, args.length - 1);
  fs.lstat(...pars, (err, r) => {
    args[0](null, { err, r });
  });
};

module.exports = (router) => {
  router.move('*', (req, res, next) => {
    const dest = req.headers.destination;
    if (!dest) {
      res.status(400).send();
      return;
    }
    if (!dest.startsWith('/storage')) {
      res.status(403).send();
      return;
    }
    req.headers.destination = dest.replace(/^\/storage/, '');
    next();
  }, (req, res) => {
    const trimmed = trim(req.path);
    if (req.path.endsWith('/')) {
      if (trimmed === '') {
        res.status(405).send();
        return;
      }
      res.redirect(307, `/${trimmed}`);
      return;
    }
    const fn = path.normalize(trimmed);
    const fullPath = getRealFilePath(fn);
    if (!fullPath) {
      logger.warn('Declined move source', req.path);
      res.status(403).send();
      return;
    }
    const dest = req.headers.destination;
    const fnD = path.normalize(trim(dest));
    const fullPathD = getRealFilePath(fnD);
    if (!fullPathD) {
      logger.warn('Declined move destination', dest);
      res.status(403).send();
      return;
    }
    if (fullPath === fullPathD) {
      res.status(412).send();
      return;
    }
    async.map([fullPath, fullPathD], safeLstat, (e0, [s, d]) => {
      if (s.err) {
        if (s.err.code !== 'ENOENT') {
          logger.error('Move source', s.err);
          res.status(500).send(s.err);
          return;
        }
        res.status(404).send();
        return;
      }
      if (d.err) {
        if (d.err.code !== 'ENOENT') {
          logger.error('Move', d.err);
          res.status(500).send(d.err);
          return;
        }
      } else if (d.r.isDirectory()) {
        if (!dest.endsWith('/')) {
          res.status(409).send();
          return;
        }
      } else {
        res.status(409).send();
        return;
      }
      try {
        if (dest.endsWith('/')) {
          shell.mkdir('-p', fullPathD);
        } else {
          shell.mkdir('-p', path.dirname(fullPathD));
        }
      } catch (e) {
        logger.error('Create folder for move', e);
        res.status(500).send(e);
        return;
      }
      try {
        logger.debug('Move file or dir', {
          source: fn,
          destination: fnD,
        });
        shell.mv(fullPath, fullPathD);
        res.status(204).send();
      } catch (e) {
        logger.error('Move', e);
        res.status(500).send(e);
      }
    });
  });
};
