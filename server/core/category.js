const _ = require('lodash');
const { hash, dedent } = require('../util');
const { run, parse } = require('../integration');
const expression = require('../integration/expression');
const logger = require('../logger')('core/category');

module.exports = (petri) => {
  petri.register({
    name: 'c-init',
    root: '/cat/:cHash',
  }, async (r) => {
    if (await r.decr({ '/init': 1 })) {
      // TODO: cache disDVars
      const cVars = await r.retrive('/:proj/hashs/cHash/:cHash').json();
      const disDVars = _.chain(r.cfg.D)
        .filter({ kind: 'discrete' })
        .filter(({ condition }) => !condition || expression.run(condition, cVars) > 0)
        .value();
      // TODO: Use Design of Experiments algorithms
      // r.cfg.initEvals
      const script = _.template(dedent`
        <% _.forEach(D, (d) => { %>
          <%= d.name %> <- seq(<%= d.lowerBound %>, <%= d.upperBound %>, length.out=<%= d.steps / 8 %>)
        <% }); %>
        rst <- expand.grid(
          <% _.forEach(D, (d) => { %>
            <%= d.name %>=<%= d.name %>
          <% }); %>
        )
        toJSON(rst)
      `)({ D: disDVars });
      run('rlang', script, {}, r.action('c-inited'));
      await r.incr({ '/initing': 1 });
    }
  });

  petri.register({
    name: 'c-inited',
    external: true,
    root: '/cat/:cHash',
  }, async (r, payload) => {
    if (await r.decr({ '/initing': 1 })) {
      const cVars = await r.retrive('/:proj/hashs/cHash/:cHash').json();
      const rst = parse(payload);
      if (!rst) {
        logger.error('Init failed', payload);
        await r.incr({ '/failure': 1, '../@': 1 });
        return;
      }
      logger.debug('Init succeed', rst);
      const vard = _.mapValues(cVars, (v, k) =>
        _.get(_.filter(r.cfg.D, { name: k }), [0, 'descriptions', v - 1], v));
      const ongoing = {};
      await r.dyn('/eval');
      if (rst[0].length) {
        for (const pars of rst[0]) {
          const dpars = _.assign({}, cVars, pars);
          const dHash = hash(dpars);
          ongoing[dHash] = dpars;
          logger.info(`Will create eval ${dHash}`, _.assign({}, vard, pars));
          await r.store('/:proj/hashs/dHash/:dHash', { dHash }, dpars);
          await r.incr({ '/eval/:dHash/init': 1 }, { dHash });
        }
      } else {
        const dHash = hash(cVars);
        ongoing[dHash] = cVars;
        logger.info(`Will create eval ${dHash}`, _.assign({}, vard));
        await r.store('/:proj/hashs/dHash/:dHash', { dHash }, cVars);
        await r.incr({ '/eval/:dHash/init': 1 }, { dHash });
      }
      await r.store('/:proj/results/cat/:cHash/history', []);
      await r.store('/:proj/results/cat/:cHash/ongoing', ongoing);
    }
  });
};
