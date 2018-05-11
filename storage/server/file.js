const _ = require('lodash');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const shell = require('shelljs');
const async = require('async');
const contentstream = require('./contentstream');
const hashDiskStorage = require('./disk');
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
        })));
      }
    });
  });
});

router.put(/^\/.*[^/]$/, (req, res) => {
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

const storage = hashDiskStorage({
  destination: path.join(dataPath, 'upload'),
});

const upload = multer({
  storage,
});

router.post('/', upload.any(), (req, res) => {
  if (req.files) {
    res.status(201).send(req.files.map(({ originalname, filename }) => ({
      old: originalname,
      new: `upload/${filename}`,
    })));
  } else {
    res.status(400).send();
  }
});

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
  const fn = path.normalize(req.path.substr(1, req.path.length - 2));
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
  const fn = path.normalize(req.path.substr(1));
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

router.post('*', (req, res) => {
  res.status(405).send();
});

router.patch('*', (req, res) => {
  res.status(405).send();
});

module.exports = router;
