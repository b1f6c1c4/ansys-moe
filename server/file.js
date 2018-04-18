const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const contentstream = require('./contentstream');
const logger = require('./logger')('file');

const router = express.Router();

const dataPath = process.env.DATA_PATH || './data';

router.use(express.static(dataPath, {
  dotfiles: 'allow',
}));

const invalidDos = /^(PRN|AUX|NUL|CON|COM[1-9]|LPT[1-9]$)(\..*)?$/i;
// eslint-disable-next-line no-control-regex
const invalidChar = /[\x00-\x1f\\?*:";|/<>]/;
const invalidSuffix = /[. ]+$/;
const isAllowed = (fn) => {
  if (fn.length > 1000) return false;
  const sp = fn.split('/');
  if (sp.length > 12) return false;
  // eslint-disable-next-line no-restricted-syntax
  for (const s of sp) {
    if (invalidDos.test(s)) return false;
    if (invalidChar.test(s)) return false;
    if (invalidSuffix.test(s)) return false;
  }
  return true;
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, dataPath);
  },
  filename(req, file, cb) {
    const fn = file.fieldname;
    if (isAllowed(fn)) {
      logger.info('Will store file', fn);
      const fullPath = path.join(dataPath, fn);
      shell.mkdir('-p', path.dirname(fullPath));
      cb(null, fn);
    } else {
      logger.debug('Declined file', fn);
      cb(Error('Field name not allowed'));
    }
  },
});

const upload = multer({
  storage,
});

router.put(/.*/, (req, res) => {
  const fn = req.path.substr(1);
  if (!isAllowed(fn)) {
    logger.debug('Declined file', fn);
    res.status(403).send();
    return;
  }
  logger.info('Will store file', fn);
  try {
    const fullPath = path.join(dataPath, fn);
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
      res.status(204).send();
    });
  } catch (e) {
    logger.error('createWriteStream', e);
    res.status(500).send(e);
  }
});

router.post('/', upload.any(), (req, res) => {
  res.status(204).send();
});

module.exports = router;
module.exports.isAllowed = isAllowed;
