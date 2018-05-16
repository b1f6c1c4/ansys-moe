const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const { dataPath, getRealFilePath } = require('./common');
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
};
