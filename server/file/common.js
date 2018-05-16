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
