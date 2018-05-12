const _ = require('lodash');
const { hash } = require('../util');
const expression = require('../integration/expression');
const logger = require('../logger')('core/global');

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
    return expression.run(condition, vars) > 0;
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
      const vard = _.mapValues(vars, (v, k) =>
        _.get(cVars, [dict[k], 'descriptions', v - 1], v));
      logger.info(`Will create category ${cHash}`, vard);
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
      logger.warn('Project done but no valid solution found');
      await r.incr({ '../@': 1 });
      return;
    }
    const final = _.find(finals, { P0: min });
    logger.info('Project done with optimal solution', final);
    await r.store('/p/:proj/results/final', final);
    await r.incr({ '/done': 1 });
  });
};
