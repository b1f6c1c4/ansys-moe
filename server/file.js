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

const isAllowed = (fn) => /^[-.a-zA-Z0-9_]+(\/[-.a-zA-Z0-9_]+){0,3}$/.test(fn);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, dataPath);
  },
  filename(req, file, cb) {
    const fn = file.fieldname;
    if (isAllowed(fn)) {
      const fullPath = path.join(dataPath, fn);
      shell.mkdir('-p', path.dirname(fullPath));
      cb(null, fn);
    } else {
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
    res.status(403).send();
    return;
  }
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
