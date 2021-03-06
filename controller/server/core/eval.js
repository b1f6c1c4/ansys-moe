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
const { run, parse } = require('../integration');
const ansys = require('./ansys');
const expression = require('../integration/expression');

module.exports = (petri) => {
  petri.register({
    name: 'e-init',
    root: '/cat/:cHash/eval/:dHash',
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      decr: { '/init': 1 },
    },
  }, async (r) => {
    const dVars = await r.retrieve('/hashs/dHash/:dHash').json();
    await r.store('/p/:proj/results/d/:dHash/var', dVars);
    await r.store('/p/:proj/results/d/:dHash/startTime', new Date().toISOString());
    await r.dyn('/G');
    for (const gpar of r.cfg.G) {
      const { name } = gpar;
      await r.incr({ '/G/:name/init': 1 }, { name });
    }
  });

  petri.register({
    name: 'e-g-done',
    root: '/cat/:cHash/eval/:dHash',
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      done: '/G',
    },
  }, async (r) => {
    const xVars = await r.retrieve('/p/:proj/results/d/:dHash/var').json();
    for (const gpar of r.cfg.G) {
      const { name, lowerBound, upperBound } = gpar;
      const val = await r.retrieve('/p/:proj/results/d/:dHash/G/:name', { name }).number();
      if ((!_.isNil(lowerBound) && lowerBound > val)
        || (!_.isNil(upperBound) && upperBound < val)) {
        r.logger.warn(`G ${name} out of bound`, r.param);
        await r.incr({ '/P0': 1 });
        return;
      }
      xVars[name] = val;
    }
    r.logger.debug('G pars done', xVars);
    await r.store('/p/:proj/results/d/:dHash/var', xVars);
    const ruleId = _.findIndex(r.cfg.ansys.rules, ({ condition }) =>
      !condition || expression.exec(condition, xVars) > 0);
    if (ruleId === -1) {
      r.logger.warn('No ansys rule matched, proceed directly');
      await r.incr({ '/M/done': 1 });
      return;
    }
    const rule = r.cfg.ansys.rules[ruleId];
    await r.store('/p/:proj/results/d/:dHash/Mid', ruleId);
    const vars = _.pick(xVars, _.map(rule.inputs, 'variable'));
    const mHashContent = {
      file: rule.source,
      vars,
      output: _.chain(rule.outputs)
        .map(({ name, design, table, column }) => [name, { design, table, column }])
        .fromPairs()
        .value(),
    };
    const mHash = hash(mHashContent);
    await r.store('/p/:proj/results/d/:dHash/mHash', mHash);
    const mVars = await r.retrieve('/results/M/:mHash', { mHash }).json();
    if (mVars) {
      r.logger.trace(`Ansys cache hit ${mHash}`, mVars);
      _.assign(xVars, mVars);
      await r.store('/p/:proj/results/d/:dHash/var', xVars);
      await r.incr({ '/M/done': 1 });
      return;
    }
    await r.store('/hashs/mHash/:mHash', { mHash }, mHashContent);
    ansys.solve(rule, vars, r.action('e-m-done'));
    await r.incr({ '/M/solve': 1 });
  });

  petri.register({
    name: 'e-m-done',
    external: true,
    root: '/cat/:cHash/eval/:dHash',
    cfg: (cfg) => _.pick(cfg, ['D', 'G', 'ansys']),
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      decr: { '/M/solve': 1 },
    },
  }, async (r, payload) => {
    const xVars = await r.retrieve('/p/:proj/results/d/:dHash/var').json();
    const ruleId = await r.retrieve('/p/:proj/results/d/:dHash/Mid').number();
    const rule = r.cfg.ansys.rules[ruleId];
    const mVars = await ansys.parse(payload, rule);
    if (!mVars) {
      switch (rule.onError) {
        case 'ignore':
          r.logger.warn('M failed, ignore and proceed', r.param);
          await r.incr({ '/M/done': 1 });
          return;
        case 'default':
          r.logger.warn('M failed, use default value', r.param);
          await r.incr({ '/P0': 1 });
          return;
        case 'halt':
        default:
          r.logger.error('M failed', r.param);
          await r.incr({ '/error': 1 });
          return;
      }
    }
    let flag = false;
    for (const mpar of rule.outputs) {
      const { name, lowerBound, upperBound } = mpar;
      const val = mVars[name];
      if ((!_.isNil(lowerBound) && lowerBound > val)
        || (!_.isNil(upperBound) && upperBound < val)) {
        r.logger.warn(`M ${name} out of bound`, r.param);
        flag = true;
      }
    }
    const mHash = await r.retrieve('/p/:proj/results/d/:dHash/mHash').string();
    await r.store('/results/M/:mHash', { mHash }, mVars);
    await ansys.store(payload, mHash);
    if (flag) {
      await r.incr({ '/P0': 1 });
      return;
    }
    _.assign(xVars, mVars);
    await r.store('/p/:proj/results/d/:dHash/var', xVars);
    await r.incr({ '/M/done': 1 });
  });

  petri.register({
    name: 'e-e-start',
    root: '/cat/:cHash/eval/:dHash',
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      decr: { '/M/done': 1 },
    },
  }, async (r) => {
    await r.dyn('/E');
    for (const epar of r.cfg.E) {
      const { name } = epar;
      await r.incr({ '/E/:name/init': 1 }, { name });
    }
  });

  petri.register({
    name: 'e-e-done',
    root: '/cat/:cHash/eval/:dHash',
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      done: '/E',
    },
  }, async (r) => {
    const xVars = await r.retrieve('/p/:proj/results/d/:dHash/var').json();
    for (const epar of r.cfg.E) {
      const { name, lowerBound, upperBound } = epar;
      const val = await r.retrieve('/p/:proj/results/d/:dHash/E/:name', { name }).number();
      if ((!_.isNil(lowerBound) && lowerBound > val)
        || (!_.isNil(upperBound) && upperBound < val)) {
        r.logger.warn(`E ${name} out of bound`, r.param);
        await r.incr({ '/P0': 1 });
        return;
      }
      xVars[name] = val;
    }
    r.logger.debug('E pars done', xVars);
    await r.store('/p/:proj/results/d/:dHash/var', xVars);
    await r.dyn('/P');
    for (const ppar of r.cfg.P) {
      const { name } = ppar;
      await r.incr({ '/P/:name/init': 1 }, { name });
    }
  });

  petri.register({
    name: 'e-p-done',
    root: '/cat/:cHash/eval/:dHash',
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      done: '/P',
    },
  }, async (r) => {
    const xVars = await r.retrieve('/p/:proj/results/d/:dHash/var').json();
    for (const ppar of r.cfg.P) {
      const { name, lowerBound, upperBound } = ppar;
      const val = await r.retrieve('/p/:proj/results/d/:dHash/P/:name', { name }).number();
      if ((!_.isNil(lowerBound) && lowerBound > val)
        || (!_.isNil(upperBound) && upperBound < val)) {
        r.logger.warn(`P ${name} out of bound`, r.param);
        await r.incr({ '/P0': 1 });
        return;
      }
      xVars[name] = val;
    }
    r.logger.debug('P pars done', xVars);
    await r.store('/p/:proj/results/d/:dHash/var', xVars);
    const p0 = expression.exec(r.cfg.P0.code, xVars);
    await r.store('/p/:proj/results/d/:dHash/P0', p0);
    await r.incr({ '/P0': 1 });
  });

  petri.register({
    name: 'e-p0',
    root: '/cat/:cHash/eval/:dHash',
    pre: {
      lte: { '/error': 0, '../../error': 0, '../../../../error': 0 },
      decr: { '/P0': 1 },
    },
  }, async (r) => {
    const p0 = await r.retrieve('/p/:proj/results/d/:dHash/P0').number();
    const dpars = await r.retrieve('/hashs/dHash/:dHash').json();
    const history = await r.retrieve('/p/:proj/results/cat/:cHash/history').json();
    r.logger.info(`Eval done (P0=${p0})`, dpars);
    const item = { D: dpars, P0: p0 };
    history.push(item);
    await r.store('/p/:proj/results/cat/:cHash/history', history);
    const ongoing = await r.retrieve('/p/:proj/results/cat/:cHash/ongoing').json();
    delete ongoing[r.param.dHash];
    await r.store('/p/:proj/results/cat/:cHash/ongoing', ongoing);
    await r.store('/p/:proj/results/d/:dHash/endTime', new Date().toISOString());
    await r.decr({ '../#': 1 });
    await r.incr({ '../@': 1, '../../iter/req': 1 });
  });

  petri.register({
    name: 'e-gep-init',
    root: '/cat/:cHash/eval/:dHash/:gep=G|E|P/:name',
    pre: {
      gte: { '/init': 1 },
      lte: { '/prep': 0, '../../error': 0, '../../../../error': 0, '../../../../../../error': 0 },
    },
    log: false,
  }, async (r) => {
    const xVars = await r.retrieve('/p/:proj/results/d/:dHash/var').json();
    const { kind, code, dependsOn } = _.find(r.cfg[r.param.gep], { name: r.param.name });
    const vars = { ...xVars };
    if (dependsOn) {
      for (const n of dependsOn) {
        if (await r.ensure('../:n/init', { n }) !== 0) {
          return;
        }
        vars[n] = await r.retrieve('/p/:proj/results/d/:dHash/:gep/:n', { n }).number();
      }
    }
    r.log();
    run(kind, code, vars, r.action(`e-${r.param.gep.toLowerCase()}-done`));
    await r.incr({ '/prep': 1 });
  });

  const eGepDone = async (r, payload) => {
    const rst = parse(payload);
    if (_.isNil(rst)) {
      r.logger.error(`${r.param.gep} ${r.param.name} failed`, payload);
      await r.incr({ '../../error': 1 });
      return;
    }
    r.logger.debug(`${r.param.gep} ${r.param.name} succeed`, rst);
    await r.store('/p/:proj/results/d/:dHash/:gep/:name', rst);
    const affected = _.chain(r.cfg[r.param.gep])
      .filter((par) => par.dependsOn && par.dependsOn.includes(r.param.name))
      .map('name')
      .value();
    for (const n of affected) {
      await r.ensure('../:n/init', { n });
    }
    await r.incr({ '../@': 1 });
  };

  petri.register({
    name: 'e-g-done',
    external: true,
    root: '/cat/:cHash/eval/:dHash/:gep=G/:name',
    cfg: (cfg) => _.pick(cfg, ['D', 'G']),
    pre: {
      lte: { '../../error': 0, '../../../../error': 0, '../../../../../../error': 0 },
      decr: { '/init': 1, '/prep': 1 },
    },
  }, eGepDone);

  petri.register({
    name: 'e-e-done',
    external: true,
    root: '/cat/:cHash/eval/:dHash/:gep=E/:name',
    cfg: (cfg) => _.pick(cfg, ['D', 'G', 'ansys', 'E']),
    pre: {
      lte: { '../../error': 0, '../../../../error': 0, '../../../../../../error': 0 },
      decr: { '/init': 1, '/prep': 1 },
    },
  }, eGepDone);

  petri.register({
    name: 'e-p-done',
    external: true,
    root: '/cat/:cHash/eval/:dHash/:gep=P/:name',
    cfg: (cfg) => _.pick(cfg, ['D', 'G', 'ansys', 'E', 'P']),
    pre: {
      lte: { '../../error': 0, '../../../../error': 0, '../../../../../../error': 0 },
      decr: { '/init': 1, '/prep': 1 },
    },
  }, eGepDone);
};
