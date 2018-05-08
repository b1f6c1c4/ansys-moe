const _ = require('lodash');
const { hash } = require('../util');
const { run, parse } = require('../integration');
const ansys = require('./ansys');
const expression = require('../integration/expression');
const logger = require('../logger')('core/eval');

module.exports = (petri) => {
  petri.register({
    name: 'e-init',
    root: '/cat/:cHash/eval/:dHash',
  }, async (r) => {
    if (await r.decr({ '/init': 1 })) {
      const dVars = await r.retrive('/:proj/hashs/dHash/:dHash').json();
      await r.store('/:proj/results/d/:dHash/var', dVars);
      await r.dyn('/G');
      for (const gpar of r.cfg.G) {
        const { name } = gpar;
        await r.incr({ '/G/:name/init': 1 }, { name });
      }
    }
  });

  petri.register({
    name: 'e-g-done',
    root: '/cat/:cHash/eval/:dHash',
  }, async (r) => {
    if (await r.done('/G')) {
      const xVars = await r.retrive('/:proj/results/d/:dHash/var').json();
      for (const gpar of r.cfg.G) {
        const { name, lowerBound, upperBound } = gpar;
        const val = await r.retrive('/:proj/results/d/:dHash/G/:name', { name }).number();
        if ((lowerBound && lowerBound > val) || (upperBound && upperBound < val)) {
          logger.warn(`G ${name} out of bound`, r.param);
          await r.incr({ '../@': 1 });
          return;
        }
        xVars[name] = val;
      }
      logger.debug('G pars done', xVars);
      await r.store('/:proj/results/d/:dHash/var', xVars);
      const ruleId = _.findIndex(r.cfg.ansys.rules, ({ condition }) =>
        !condition || expression.run(condition, xVars) > 0);
      const rule = r.cfg.ansys.rules[ruleId];
      await r.store('/:proj/results/d/:dHash/Mid', ruleId);
      const vars = _.pick(xVars, _.map(rule.inputs, 'variable'));
      const mHashContent = {
        filename: rule.filename,
        vars,
      };
      const mHash = hash(mHashContent);
      await r.store('/:proj/hashs/m/:mHash', { mHash }, mHashContent);
      ansys.solve(rule, vars, r.action('e-m-done'));
      await r.incr({ '/M/solve': 1 });
    }
  });

  petri.register({
    name: 'e-m-done',
    external: true,
    root: '/cat/:cHash/eval/:dHash',
  }, async (r, payload) => {
    if (await r.done('/M/solve')) {
      const xVars = await r.retrive('/:proj/results/d/:dHash/var').json();
      const ruleId = await r.retrive('/:proj/results/d/:dHash/Mid').number();
      const rule = r.cfg.ansys.rules[ruleId];
      const mVars = await ansys.parse(payload, rule);
      if (!mVars) {
        logger.warn('M failed', r.param);
        await r.incr({ '../@': 1 });
        return;
      }
      _.assign(xVars, mVars);
      await r.store('/:proj/results/d/:dHash/var', xVars);
      await r.dyn('/E');
      for (const epar of r.cfg.E) {
        const { name } = epar;
        await r.incr({ '/E/:name/init': 1 }, { name });
      }
    }
  });

  petri.register({
    name: 'e-e-done',
    root: '/cat/:cHash/eval/:dHash',
  }, async (r) => {
    if (await r.done('/E')) {
      const xVars = await r.retrive('/:proj/results/d/:dHash/var').json();
      for (const epar of r.cfg.E) {
        const { name, lowerBound, upperBound } = epar;
        const val = await r.retrive('/:proj/results/d/:dHash/E/:name', { name }).number();
        if ((lowerBound && lowerBound > val) || (upperBound && upperBound < val)) {
          logger.warn(`E ${name} out of bound`, r.param);
          await r.incr({ '../@': 1 });
          return;
        }
        xVars[name] = val;
      }
      logger.debug('E pars done', xVars);
      await r.store('/:proj/results/d/:dHash/var', xVars);
      await r.dyn('/P');
      for (const ppar of r.cfg.P) {
        const { name } = ppar;
        await r.incr({ '/P/:name/init': 1 }, { name });
      }
    }
  });

  petri.register({
    name: 'e-p-done',
    root: '/cat/:cHash/eval/:dHash',
  }, async (r) => {
    if (await r.done('/P')) {
      const xVars = await r.retrive('/:proj/results/d/:dHash/var').json();
      for (const ppar of r.cfg.P) {
        const { name, lowerBound, upperBound } = ppar;
        const val = await r.retrive('/:proj/results/d/:dHash/P/:name', { name }).number();
        if ((lowerBound && lowerBound > val) || (upperBound && upperBound < val)) {
          logger.warn(`P ${name} out of bound`, r.param);
          await r.incr({ '../@': 1 });
          return;
        }
        xVars[name] = val;
      }
      logger.debug('P pars done', xVars);
      await r.store('/:proj/results/d/:dHash/var', xVars);
      const p0 = expression.run(r.cfg.P0.code, xVars);
      const dpars = await r.retrive('/:proj/hashs/dHash/:dHash').json();
      const history = await r.retrive('/:proj/results/cat/:cHash/history').json();
      logger.info(`Eval done (P0=${p0})`, dpars);
      const item = { D: dpars, P0: p0 };
      history.push(item);
      await r.store('/:proj/results/cat/:cHash/history', history);
      const ongoing = await r.retrive('/:proj/results/cat/:cHash/ongoing').json();
      delete ongoing[r.param.dHash];
      await r.store('/:proj/results/cat/:cHash/ongoing', ongoing);
      await r.decr({ '../#': 1 });
      await r.incr({ '../@': 1, '../../iter/req': 1 });
    }
  });

  petri.register({
    name: 'e-gep-init',
    root: '/cat/:cHash/eval/:dHash/:gep=G|E|P/:name',
  }, async (r) => {
    if (await r.ensure('/init') > 0 &&
      await r.ensure('/prep') === 0) {
      const xVars = await r.retrive('/:proj/results/d/:dHash/var').json();
      const { kind, code, dependsOn } = _.find(r.cfg[r.param.gep], { name: r.param.name });
      const vars = { ...xVars };
      if (dependsOn) {
        for (const n of dependsOn) {
          if (await r.ensure('../:n/init', { n }) !== 0) {
            return;
          }
          vars[n] = await r.retrive('/:proj/results/d/:dHash/:gep/:n', { n }).number();
        }
      }
      run(kind, code, vars, r.action('e-gep-done'));
      await r.incr({ '/prep': 1 });
    }
  });

  petri.register({
    name: 'e-gep-done',
    external: true,
    root: '/cat/:cHash/eval/:dHash/:gep=G|E|P/:name',
  }, async (r, payload) => {
    if (await r.decr({ '/init': 1, '/prep': 1 })) {
      const rst = parse(payload);
      if (!rst) {
        logger.fatal(`${r.param.gep} ${r.param.name} failed`, payload);
        await r.incr({ '../@': 1, '../!': 1 }); // TODO: handle G|E|P bug
        return;
      }
      logger.debug(`${r.param.gep} ${r.param.name} succeed`, rst);
      await r.store('/:proj/results/d/:dHash/:gep/:name', rst[0]);
      const affected = _.chain(r.cfg[r.param.gep])
        .filter((par) => par.dependsOn && par.dependsOn.includes(r.param.name))
        .map('name')
        .value();
      for (const n of affected) {
        await r.ensure('../:n/init', { n });
      }
      await r.incr({ '../@': 1 });
    }
  });
};
