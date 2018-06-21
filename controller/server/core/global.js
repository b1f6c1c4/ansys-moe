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
const { hash } = require('../util');
const expression = require('../integration/expression');

function enumerateCategories(values, results, cVars, dict) {
  const id = _.findIndex(values, (v, i) => {
    if (v !== undefined) {
      return false;
    }
    const { dependsOn, condition } = cVars[i];
    if (!dependsOn) {
      return true;
    }
    const vars = {};
    if (!_.every(dependsOn, (x) => {
      vars[x] = values[dict[x]];
      return vars[x] !== undefined;
    })) {
      return false;
    }
    if (!condition) {
      return true;
    }
    return expression.exec(condition, vars) > 0;
  });
  if (id === -1) {
    results.push([...values]);
    return;
  }
  const { steps } = cVars[id];
  _.range(1, steps + 1).forEach((v) => {
    // eslint-disable-next-line no-param-reassign
    values[id] = v;
    enumerateCategories(values, results, cVars, dict);
  });
  // eslint-disable-next-line no-param-reassign
  delete values[id];
}

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
    pre: {
      lte: { '/error': 0 },
    },
  }, async (r) => {
    await r.incr({ '/init': 1 });
  });

  petri.register({
    name: 'categories',
    pre: {
      lte: { '/error': 0 },
      decr: { '/init': 1 },
    },
  }, async (r) => {
    const cVars = _.filter(r.cfg.D, { kind: 'categorical' });
    const dict = _.fromPairs(_.map(cVars, ({ name }, i) => [name, i]));
    const results = [];
    enumerateCategories(Array(cVars.length), results, cVars, dict);
    await r.dyn('/cat');
    for (const values of results) {
      const vars = _.mapKeys(values, (v, i) => cVars[i].name);
      const cHash = hash(vars);
      r.logger.info(`Will create category ${cHash}`, vars);
      await r.store('/hashs/cHash/:cHash', { cHash }, vars);
      await r.incr({ '/cat/:cHash/init': 1 }, { cHash });
    }
  });

  petri.register({
    name: 'categories-done',
    pre: {
      lte: { '/error': 0 },
      done: '/cat',
    },
  }, async (r) => {
    const finals = await r.retrieve('/p/:proj/results/finals').json();
    const min = _.min(_.map(finals, 'P0'));
    if (min === undefined) {
      r.logger.warn('Project done but no valid solution found');
      await r.incr({ '../@': 1 });
      return;
    }
    const final = _.find(finals, { P0: min });
    r.logger.info('Project done with optimal solution', final);
    await r.store('/p/:proj/results/final', final);
    await r.incr({ '/done': 1 });
  });
};
