const _ = require('lodash');
const { hash } = require('../util');
const { run, parse } = require('../integration');
const ansys = require('./ansys');
const expression = require('../integration/expression');
const logger = require('../logger')('core/category');

module.exports = (petri) => {
  petri.register({
    name: 'p-init',
    root: '/cat/:cHash/:phase=scan|iterate/:dHash',
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
    name: 'p-g-done',
    root: '/cat/:cHash/:phase=scan|iterate/:dHash',
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
      logger.info('G pars done', xVars);
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
      ansys.solve(rule, vars, r.action('p-m-done'));
      await r.incr({ '/M/solve': 1 });
    }
  });

  petri.register({
    name: 'p-m-done',
    external: true,
    root: '/cat/:cHash/:phase=scan|iterate/:dHash',
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
    name: 'p-gep-init',
    root: '/cat/:cHash/:phase=scan|iterate/:dHash/:phase2=G|E|P/:name',
  }, async (r) => {
    if (await r.ensure('/init') > 0 &&
      await r.ensure('/prep') === 0) {
      const xVars = await r.retrive('/:proj/results/d/:dHash/var').json();
      const { kind, code, dependsOn } = _.find(r.cfg[r.param.phase2], { name: r.param.name });
      const vars = { ...xVars };
      if (dependsOn) {
        for (const n of dependsOn) {
          if (await r.ensure('../:n/init', { n }) !== 0) {
            return;
          }
          vars[n] = await r.retrive('/:proj/results/d/:dHash/:phase2/:n', { n }).number();
        }
      }
      run(kind, code, vars, r.action('p-gep-done'));
      await r.incr({ '/prep': 1 });
    }
  });

  petri.register({
    name: 'p-gep-done',
    external: true,
    root: '/cat/:cHash/:phase=scan|iterate/:dHash/:phase2=G|E|P/:name',
  }, async (r, payload) => {
    if (await r.decr({ '/init': 1, '/prep': 1 })) {
      const rst = parse(payload);
      if (!rst) {
        logger.fatal(`G ${r.param.name} failed`, payload);
        await r.incr({ '../@': 1, '../!': 1 }); // TODO: handle G|E|P bug
        return;
      }
      logger.debug(`G ${r.param.name} succeed`, rst);
      await r.store('/:proj/results/d/:dHash/:phase2/:name', rst[0]);
      const affected = _.chain(r.cfg[r.param.phase2])
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
