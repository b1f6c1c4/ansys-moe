const express = require('express');
const { dataPath } = require('./common');
const httpGet = require('./get');
const httpPost = require('./post');
const httpPut = require('./put');
const httpDelete = require('./delete');

const router = express.Router();

router.use((req, res, next) => {
  res.header('Cache-Control', 'public');
  res.header('Cache-Control', 'must-revalidate');
  next();
}, express.static(dataPath, {
  dotfiles: 'allow',
  index: false,
}));

httpGet(router);
httpPost(router);
httpPut(router);
httpDelete(router);

router.post('*', (req, res) => {
  res.status(405).send();
});

router.patch('*', (req, res) => {
  res.status(405).send();
});

module.exports = router;
