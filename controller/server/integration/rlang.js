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

module.exports.run = (code, variables) => {
  const imports = _.toPairs(variables).map(([key, value]) =>
    `${key} <- ${value.toString(10)};`).join('\n');
  const script = dedent`
    sink(stderr());
    library(jsonlite);
    ${imports}
    sink();
    ${code}
  `;
  return { script };
};

module.exports.parse = ({ type, result }, simplify = true) => {
  if (type !== 'done') {
    return null;
  }
  const sp = result.split('\n');
  const vals = _.chain(sp)
    .filter((s) => /^\{|\[/.test(s))
    .map(_.unary(JSON.parse))
    .value();
  if (simplify) {
    return vals[0][0];
  }
  return vals;
};
