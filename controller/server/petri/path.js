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

const patternSgmt = /^\/:([a-zA-Z][-_a-zA-Z0-9]*)(=(?:[^\\/]|\\\\|\\\/)+)?|\/[^:/][^/]*/;
const plainSgmt = /^\/([^/]*)/;

const sepPrefix = (raw) => {
  const xmatch = raw.match(/^(?:(?:\.\.\/)*\.\.)?/);
  const [prefix] = xmatch;
  const rest = raw.substr(prefix.length);
  return [prefix, rest];
};

class CompiledPath {
  constructor(raw) {
    const [prefix, p] = sepPrefix(raw);
    let r = p;
    this.prefix = prefix;
    this.segments = [];
    while (r.length) {
      const match = r.match(patternSgmt);
      if (!match) {
        throw new Error('Not a valid path');
      }
      if (match[2]) {
        this.segments.push({
          name: match[1],
          type: 'regex',
          regex: new RegExp(`^${match[2].substr(1)}$`),
        });
      } else if (match[1]) {
        this.segments.push({
          name: match[1],
          type: 'any',
        });
      } else {
        this.segments.push({
          type: 'fixed',
          value: match[0].substr(1),
        });
      }
      r = r.substr(match[0].length);
    }
  }

  match(raw) {
    const [prefix, p] = sepPrefix(raw);
    if (this.prefix !== prefix) {
      return undefined;
    }
    const result = { path: prefix, rest: p };
    for (const sg of this.segments) {
      const match = result.rest.match(plainSgmt);
      if (!match) {
        return undefined;
      }
      switch (sg.type) {
        case 'regex': {
          const m = match[1].match(sg.regex);
          if (!m) {
            return undefined;
          }
          result.path += match[0];
          _.set(result, sg.name, match[1]);
          _.set(result, ['details', sg.name], m);
          break;
        }
        case 'any':
          if (!/^[-_a-zA-Z0-9]*$/.test(match[1])) {
            return undefined;
          }
          result.path += match[0];
          _.set(result, sg.name, match[1]);
          break;
        case 'fixed':
          if (sg.value !== match[1]) {
            return undefined;
          }
          result.path += match[0];
          break;
        /* istanbul ignore next */
        default:
          throw new Error('Type not supported');
      }
      result.rest = result.rest.substr(match[0].length);
    }
    return result;
  }

  build(...args) {
    const pars = _.merge({}, ...args);
    let result = this.prefix;
    for (const sg of this.segments) {
      switch (sg.type) {
        case 'regex':
        case 'any':
          result += `/${_.get(pars, sg.name, '')}`;
          break;
        case 'fixed':
          result += `/${sg.value}`;
          break;
        /* istanbul ignore next */
        default:
          throw new Error('Type not supported');
      }
    }
    return result;
  }
}

module.exports.CompiledPath = CompiledPath;
module.exports.match = (p, ...args) => new CompiledPath(p).match(...args);
module.exports.build = (p, ...args) => new CompiledPath(p).build(...args);

