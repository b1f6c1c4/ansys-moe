const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const contentstream = require('./contentstream');
const logger = require('./logger')('file');

const router = express.Router();

const dataPath = process.env.DATA_PATH || './data';

router.use(express.static(dataPath, {
  dotfiles: 'allow',
}));

const isAllowed = (fn) => /^[-.a-zA-Z0-9_]+$/.test(fn);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, dataPath);
  },
  filename(req, file, cb) {
    const fn = file.fieldname;
    if (isAllowed(fn)) {
      cb(null, fn);
    } else {
      cb(Error('Field name not allowed'));
    }
  },
});

const upload = multer({
  storage,
});

router.put('/:fn', (req, res) => {
  const { fn } = req.params;
  if (!isAllowed(fn)) {
    res.status(403).send();
    return;
  }
  try {
    const f = fs.createWriteStream(path.join(dataPath, fn));
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
    logger.error(e);
    res.status(500).send(e);
  }
});

router.post('/', upload.any(), (req, res) => {
  res.status(204).send();
});

module.exports = router;
