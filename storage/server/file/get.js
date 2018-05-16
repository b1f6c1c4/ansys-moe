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
