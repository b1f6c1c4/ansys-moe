const _ = require('lodash');
const { hash, dedent } = require('../util');
// const { run, parse } = require('../integration');
// const ansys = require('./ansys');
const expression = require('../integration/expression');
const logger = require('../logger')('core/logic');

function enumerateCategories(values, results, catDVars, dict) {
  const id = _.findIndex(values, (v, i) => {
    if (v !== undefined) {
      return false;
    }
    const { dependsOn, condition } = catDVars[i];
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
  const { steps } = catDVars[id];
  _.range(1, steps + 1).forEach((v) => {
    // eslint-disable-next-line no-param-reassign
    values[id] = v;
    enumerateCategories(values, results, catDVars, dict);
  });
  // eslint-disable-next-line no-param-reassign
  delete values[id];
}

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r) => {
    await r.incr({ '/init': 1 });
  });

  petri.register({
    name: 'categories',
  }, async (r) => {
    if (await r.decr({ '/init': 1 })) {
      const catDVars = _.filter(r.cfg.D, { kind: 'categorical' });
      const dict = _.fromPairs(_.map(catDVars, ({ name }, i) => [name, i]));
      const results = [];
      enumerateCategories(Array(catDVars.length), results, catDVars, dict);
      await r.dyn('/cat');
      for (const values of results) {
        const vars = _.mapKeys(values, (v, i) => catDVars[i].name);
        const cHash = hash(vars);
        await r.incr({ '/cat/:cHash/init': 1 }, { cHash });
      }
    }
  });
};
