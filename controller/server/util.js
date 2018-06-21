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
const _ = require('lodash');
const crypto = require('crypto');
const stringify = require('json-stable-stringify');

module.exports.hash = (obj, long = false) => {
  const str = stringify(obj);
  const hash = crypto.createHash('md5').update(str).digest('hex');
  if (long) {
    return hash;
  }
  return hash.slice(8, 16);
};

module.exports.newId = (l = 8) =>
  Math.round((36 ** (l + 1)) - (Math.random() * (36 ** l))).toString(36).slice(1);

module.exports.cIdGen = ({ proj, name, root }) => root
  ? `${proj}.${name}${root.replace(/\//g, '.')}`
  : `${proj}.${name}`;

module.exports.cIdParse = (id) => {
  const [proj, name, ...rest] = id.split('.');
  return {
    proj,
    name,
    root: rest.length === 0 ? undefined : `/${rest.join('/')}`,
  };
};

// https://gist.github.com/zenparsing/5dffde82d9acef19e43c
module.exports.dedent = (callSite, ...args) => {
  function format(str) {
    let size = -1;

    return str.replace(/\n([ \t]+)/g, (m, m1) => {
      if (size < 0) {
        size = m1.replace(/\t/g, '    ').length;
      }
      return `\n${m1.slice(Math.min(m1.length, size))}`;
    }).replace(/^\n/, '');
  }

  if (_.isString(callSite)) {
    return format(callSite);
  }

  if (_.isFunction(callSite)) {
    return _.compose(format, callSite);
  }

  const output = callSite
    .slice(0, args.length + 1)
    .map((text, i) => (i === 0 ? '' : args[i - 1]) + text)
    .join('');

  return format(output);
};
