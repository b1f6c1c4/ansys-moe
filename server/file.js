const _ = require('lodash');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const async = require('async');
const contentstream = require('./contentstream');
const logger = require('./logger')('file');

const router = express.Router();

const dataPath = process.env.DATA_PATH || './data';

router.use((req, res, next) => {
  res.header('Cache-Control', 'public');
  res.header('Cache-Control', 'must-revalidate');
  next();
}, express.static(dataPath, {
  dotfiles: 'allow',
  index: false,
}));

const invalidDos = /^(PRN|AUX|NUL|CON|COM[1-9]|LPT[1-9]$)(\..*)?$/i;
// eslint-disable-next-line no-control-regex
const invalidChar = /[\x00-\x1f\\?*:";|/<>]/;
const invalidSuffix = /[. ]+$/;
const getRealFilePath = (fn) => {
  if (fn !== '.') {
    if (fn.length > 1000) return null;
    const sp = fn.split('/');
    if (sp.length > 12) return null;
    // eslint-disable-next-line no-restricted-syntax
    for (const s of sp) {
      if (invalidDos.test(s)) return null;
      if (invalidChar.test(s)) return null;
      if (invalidSuffix.test(s)) return null;
    }
  }
  const fullPath = path.normalize(path.join(dataPath, fn));
  const rootPath = path.normalize(dataPath);
  if (fullPath.substr(0, rootPath.length) === rootPath) {
    logger.trace('Valid fullPath', fullPath);
    return fullPath;
  }
  return null;
};

const storage = multer.diskStorage({
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
});

const upload = multer({
  storage,
});

router.get(/\/$/, (req, res) => {
  const fn = path.normalize(req.path.substr(1, req.path.length - 2));
  logger.silly('Will list directory', fn);
  const fullPath = getRealFilePath(fn);
  if (!fullPath) {
    logger.warn('Declined directory', req.path);
    res.status(403).send();
    return;
  }
  fs.readdir(fullPath, (err, files) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(404).send();
      } else {
        logger.error('List directory', err);
        res.status(500).send(err);
      }
    } else {
      async.mapLimit(files.map((f) => path.join(fullPath, f)), 10, fs.lstat, (err2, results) => {
        if (err2) {
          logger.error('List directory', err2);
          res.status(500).send(err2);
        } else {
          logger.debug('List directory succeed', fn);
          res.status(200).json(_.zipWith(files, results, (f, r) => ({
            name: f,
            dir: r.isDirectory(),
          })));
        }
      });
    }
  });
});

router.put(/[^/]$/, (req, res) => {
  const fn = path.normalize(req.path.substr(1));
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

router.post('/', upload.any(), (req, res) => {
  res.status(204).send();
});

module.exports = router;
