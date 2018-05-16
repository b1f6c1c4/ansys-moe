const express = require('express');
const shell = require('shelljs');
const { dataPath } = require('./common');
const httpGet = require('./get');
const httpPost = require('./post');
const httpPut = require('./put');
const httpDelete = require('./delete');
const httpMove = require('./move');

const router = express.Router();

shell.config.fatal = true;

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
httpMove(router);

router.all('*', (req, res) => {
  res.status(405).send();
});

module.exports = router;
