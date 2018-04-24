const _ = require('lodash');

const patternSgmt = /^\/:([a-zA-Z][-_a-zA-Z0-9]*)(=(?:[^\\/]|\\\\|\\\/)+)?|\/[^:/][^/]*/;
const plainSgmt = /^\/([^/]*)/;

class CompiledPath {
  constructor(r) {
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
      // eslint-disable-next-line no-param-reassign
      r = r.substr(match[0].length);
    }
  }

  match(p) {
    const result = { path: '', rest: p };
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
    let result = '';
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

