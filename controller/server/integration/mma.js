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
const { dedent } = require('../util');
const logger = require('../logger')('integration/mma');

module.exports.run = (code, variables) => {
  const imports = _.toPairs(variables).map(([key, value]) =>
    `${key} = ${value.toString(10)}\`;`).join('\n');
  const script = dedent`
    ${imports}
    ${code}
  `;
  return { script };
};

module.exports.parse = ({ type, result }) => {
  if (type !== 'done') {
    return null;
  }
  const res = parseFloat(result);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(res)) {
    logger.warn('Parse mma result fail', result);
    return null;
  }
  return res;
};
