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
const { Parser } = require('expr-eval');
const logger = require('../logger')('integration/expression');

module.exports.exec = (code, variables) => {
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    return expr.evaluate(variables);
  } catch (e) {
    return null;
  }
};

module.exports.wrapped = (code, variables) => {
  let action;
  try {
    const parser = new Parser();
    const expr = parser.parse(code);
    action = {
      type: 'done',
      result: expr.evaluate(variables),
    };
  } catch (e) {
    logger.warn('Expr fail', code);
    action = {
      type: 'failure',
      result: e.stack,
    };
  }
  logger.silly('Expr result', { code, action });
  return action;
};
