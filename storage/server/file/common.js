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
const path = require('path');
const logger = require('../logger')('file/common');

const dataPath = process.env.DATA_PATH || './data';

const invalidDos = /^(PRN|AUX|NUL|CON|COM[1-9]|LPT[1-9]$)(\..*)?$/i;
// eslint-disable-next-line no-control-regex
const invalidChar = /[\x00-\x1f\\?*:";|/<>]/;
const invalidSuffix = /[. ]+$/;
const getRealFilePath = (fn) => {
  if (fn !== '.') {
    if (fn.length > 1000) return null;
    const sp = fn.split(path.sep);
    logger.silly('split', sp);
    if (sp.length > 12) return null;
    // eslint-disable-next-line no-restricted-syntax
    for (const s of sp) {
      if (invalidDos.test(s)) return null;
      if (invalidChar.test(s)) return null;
      if (invalidSuffix.test(s)) return null;
    }
  }
  const fullPath = path.normalize(path.join(dataPath, fn));
  logger.silly('fullPath', fullPath);
  const rootPath = path.normalize(dataPath);
  logger.silly('rootPath', rootPath);
  if (fullPath.substr(0, rootPath.length) === rootPath) {
    logger.trace('Valid fullPath', fullPath);
    return fullPath;
  }
  return null;
};

module.exports.dataPath = dataPath;
module.exports.trim = (s) => s.replace(/^\/+|\/+$/g, '');
module.exports.getRealFilePath = getRealFilePath;
