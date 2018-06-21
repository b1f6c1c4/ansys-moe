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
const multer = require('multer');
const path = require('path');
const shell = require('shelljs');
const { dataPath, getRealFilePath } = require('./common');
const hashDiskStorage = require('../utils/disk');
const logger = require('../logger')('file/post');

const uploadRaw = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, dataPath);
    },
    filename(req, file, cb) {
      const fn = path.normalize(file.fieldname);
      const fullPath = getRealFilePath(fn);
      if (fullPath) {
        logger.trace('Will store file', fn);
        shell.mkdir('-p', path.dirname(fullPath));
        cb(null, fn);
      } else {
        logger.warn('Declined file', file.fieldname);
        cb(Error('Field name not allowed'));
      }
    },
  }),
});

const uploadHash = multer({
  storage: hashDiskStorage({
    destination: path.join(dataPath, 'upload'),
  }),
});

module.exports = (router) => {
  router.post('/', uploadRaw.any(), (req, res) => {
    res.status(204).send();
  });

  router.post('/upload/', uploadHash.any(), (req, res) => {
    if (req.files) {
      res.status(201).send(req.files.map(({ originalname, filename }) => ({
        old: originalname,
        new: `upload/${filename}`,
      })));
    } else {
      res.status(400).send();
    }
  });
};
