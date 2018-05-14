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
      .filter(({ condition }) => !condition || expression.run(condition, cVars) > 0)
      .value();
    r.logger.debug('Category D vars', dVars);
    await r.store('/p/:proj/results/cat/:cHash/D', dVars);
    // TODO: Use Design of Experiments algorithms
    // r.cfg.initEvals
    const script = _.template(dedent`
      <% _.forEach(D, (d) => { %>
        <%= d.name %> <- seq(
          <%= d.lowerBound %>,
          <%= d.upperBound %>,
          <% if (d.kind === 'discrete') { %>
            length.out=<%= (d.steps - 1) / 5 %>
          <% } else { %>
            <%= d.precision * 5 %>
          <% } %>
          );
      <% }); %>
      rst <- expand.grid(
        <% _.forEach(D, (d) => { %>
          <%= d.name %>=<%= d.name %>
        <% }); %>
      )
      toJSON(rst)
    `)({ D: dVars });
    run('rlang', script, {}, r.action('c-inited'));
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
    const ongoing = {};
    await r.dyn('/eval');
    if (rst[0].length) {
      for (const pars of rst[0]) {
        const dpars = _.assign({}, cVars, pars);
        const dHash = hash(dpars);
        ongoing[dHash] = dpars;
        r.logger.info(`Will create eval ${dHash}`, dpars);
        await r.store('/hashs/dHash/:dHash', { dHash }, dpars);
        await r.incr({ '/eval/:dHash/init': 1 }, { dHash });
      }
    } else {
      const dHash = hash(cVars);
      ongoing[dHash] = cVars;
      r.logger.info(`Will create eval ${dHash}`, _.assign({}, cVars));
      await r.store('/hashs/dHash/:dHash', { dHash }, cVars);
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
