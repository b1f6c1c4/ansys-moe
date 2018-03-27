const express = require('express');
const multer = require('multer');

const router = express.Router();

const dataPath = process.env.DATA_PATH || './data';

router.use(express.static(dataPath, {
  dotfiles: 'allow',
}));

const storage = multer.diskStorage({
  filename(req, file, cb) {
    console.log(req, file, cb);
    if (/^[-a-zA-Z0-9_]+$/.test(file.fieldname)) {
      cb(null, file.fieldname);
    } else {
      cb(Error('Field name not allowed'));
    }
  },
});

const upload = multer({
  dest: dataPath,
  storage,
});

router.put('/*', upload.array(), (req, res) => {
  res.status(200).send();
});

module.exports = router;
