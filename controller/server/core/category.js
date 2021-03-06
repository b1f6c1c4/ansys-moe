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
const { hash, dedent } = require('../util');
const { run, parse } = require('../integration');
const expression = require('../integration/expression');

module.exports = (petri) => {
  petri.register({
    name: 'c-init',
    root: '/cat/:cHash',
    pre: {
      lte: { '/error': 0, '../../error': 0 },
      decr: { '/init': 1 },
    },
  }, async (r) => {
    const cVars = await r.retrieve('/hashs/cHash/:cHash').json();
    const dVars = _.chain(r.cfg.D)
      .reject({ kind: 'categorical' })
      .filter(({ condition }) => !condition || expression.exec(condition, cVars) > 0)
      .value();
    r.logger.debug('Category D vars', dVars);
    await r.store('/p/:proj/results/cat/:cHash/D', dVars);
    if (!dVars.length) {
      const ongoing = {};
      await r.dyn('/eval');
      const dHash = hash(cVars);
      ongoing[dHash] = cVars;
      r.logger.info(`Will create eval ${dHash}`, _.assign({}, cVars));
      await r.store('/hashs/dHash/:dHash', { dHash }, cVars);
      await r.incr({ '/eval/:dHash/init': 1 }, { dHash });
      await r.store('/p/:proj/results/cat/:cHash/history', []);
      await r.store('/p/:proj/results/cat/:cHash/ongoing', ongoing);
      return;
    }
    const rngs = dVars.map((d) => {
      if (d.kind === 'discrete') {
        return d.steps;
      }
      return Math.ceil(((d.upperBound - d.lowerBound) / d.precision) + 0.5);
    });
    const script = _.template(dedent`
      import doe
      rngs = [<%= rngs.join(', ') %>]
      print(dumps(doe.run(rngs, <%= n %>), primitives=True))
    `)({ rngs, n: r.cfg.initEvals });
    run('python', script, {}, r.action('c-inited'));
    await r.incr({ '/initing': 1 });
  });

  petri.register({
    name: 'c-inited',
    external: true,
    root: '/cat/:cHash',
    cfg: (cfg) => _.pick(cfg, ['initEvals', 'D']),
    pre: {
      lte: { '/error': 0, '../../error': 0 },
      decr: { '/initing': 1 },
    },
  }, async (r, payload) => {
    const cVars = await r.retrieve('/hashs/cHash/:cHash').json();
    const rst = parse(payload, false);
    if (!rst) {
      r.logger.error('Init failed', payload);
      await r.incr({ '/error': 1 });
      return;
    }
    r.logger.debug('Init succeed', rst);
    const dVars = await r.retrieve('/p/:proj/results/cat/:cHash/D').json();
    const initPoints = rst[0];
    r.logger.silly('initPoints', initPoints);
    const getPars = (p) => _.fromPairs(dVars.map((d, i) => {
      r.logger.silly('in getPars', { d, i, p: p[i] });
      const steps = d.kind === 'discrete'
        ? d.steps
        : Math.ceil(((d.upperBound - d.lowerBound) / d.precision) + 0.5);
      return [d.name, ((p[i] / (steps - 1)) * (d.upperBound - d.lowerBound)) + d.lowerBound];
    }));
    const ongoing = {};
    await r.dyn('/eval');
    for (const pt of initPoints) {
      const pars = getPars(pt);
      r.logger.silly('in for of', { pt, pars });
      const dpars = _.assign({}, cVars, pars);
      const dHash = hash(dpars);
      ongoing[dHash] = dpars;
      r.logger.info(`Will create eval ${dHash}`, dpars);
      await r.store('/hashs/dHash/:dHash', { dHash }, dpars);
      await r.incr({ '/eval/:dHash/init': 1 }, { dHash });
    }
    await r.store('/p/:proj/results/cat/:cHash/history', []);
    await r.store('/p/:proj/results/cat/:cHash/ongoing', ongoing);
  });

  petri.register({
    name: 'c-converge',
    root: '/cat/:cHash',
    cfg: (cfg) => _.pick(cfg, ['initEvals', 'D']),
    pre: {
      lte: { '/eval/#': 0, '/error': 0, '../../error': 0 },
      decr: { '/eval': 1, '/conv': 1 },
    },
  }, async (r) => {
    const history = await r.retrieve('/p/:proj/results/cat/:cHash/history').json();
    const min = _.min(_.map(history, 'P0'));
    const final = min !== undefined && _.find(history, { P0: min });
    if (!final) {
      r.logger.warn('No valid solution found in category');
      await r.incr({ '../@': 1 });
      return;
    }
    r.logger.info('Found optimal solution in category', final);
    const finals = (await r.retrieve('/p/:proj/results/finals').json()) || [];
    finals.push(final);
    await r.store('/p/:proj/results/finals', finals);
    await r.incr({ '../@': 1 });
  });
};
