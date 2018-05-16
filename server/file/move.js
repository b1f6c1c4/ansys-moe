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
  router.move('*', (req, res) => {
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
    if (!dest) {
      res.status(400).send();
      return;
    }
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
        if (dest.endsWith('/')) {
          try {
            logger.trace('Create folder for move', fnD);
            shell.mkdir('-p', fullPathD);
          } catch (e) {
            logger.error('Create folder for move', e);
            res.status(500).send(e);
            return;
          }
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
