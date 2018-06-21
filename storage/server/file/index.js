/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
