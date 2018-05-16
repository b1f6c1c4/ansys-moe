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
