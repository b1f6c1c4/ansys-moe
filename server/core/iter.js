const _ = require('lodash');
const { hash, newId, dedent } = require('../util');
const { run, cancel, parse } = require('../integration');
const expression = require('../integration/expression');
const logger = require('../logger')('core/iter');

module.exports = (petri) => {
  petri.register({
    name: 'i-new-req',
    external: true,
    root: '/cat/:cHash',
  }, async (r) => {
    await r.incr({ '/iter/req': 1 });
  });

  petri.register({
    name: 'i-req',
    root: '/cat/:cHash',
  }, async (r) => {
    if (await r.decr({ '/iter/req': 1 })) {
      // Check if category still running
      if (!await r.ensure('/eval')) {
        return;
      }
      // Check if enough evals have done
      if (await r.ensure('/eval/@') < r.cfg.minEvals) {
        return;
      }
      const concurrent = await r.retrive('/:proj/concurrent').number();
      // Check if concurrent evals are enough
      if (await r.ensure('/eval/#') >= concurrent) {
        return;
      }
      // Cancel ongoing iter calculation
      if (await r.decr({ '/iter/calc': 1 })) {
        const oldId = await r.retrive('/:proj/results/cat/:cHash/iterate').string();
        cancel('rlang', oldId);
      }

      // Run iter calculation
      // TODO: cache disDVars
      const cVars = await r.retrive('/:proj/hashs/cHash/:cHash').json();
      const disDVars = _.chain(r.cfg.D)
        .filter({ kind: 'discrete' })
        .filter(({ condition }) => !condition || expression.run(condition, cVars) > 0)
        .value();
      const rngs = disDVars.map((d) => d.steps);
      const history = await r.retrive('/:proj/results/cat/:cHash/history').json();
      const ongoing = await r.retrive('/:proj/results/cat/:cHash/ongoing').json();
      const tDpar = (dpar) => disDVars.map(({ name, lowerBound, upperBound }) =>
        (dpar[name] - lowerBound) / (upperBound - lowerBound));
      const script = _.template(dedent`
        sink(stderr());
        source("R/ei.R");
        library(jsonlite);
        rngs <- c(<%= rngs.join(', ') %>);
        sampled <- t(matrix(c(<%= sampled.join(', ') %>), nrow=<%= rngs.length %>));
        values <- c(<%= values.join(', ') %>);
        being_sampled <- t(matrix(c(<%= beingSampled.join(', ') %>), nrow=<%= rngs.length %>));
        rst <- eiopt(rngs, sampled, values, being_sampled);
        sink();
        print(toJSON(rst));
      `)({
        rngs,
        sampled: _.chain(history)
          .map('D')
          .map(tDpar)
          .flatten()
          .value(),
        values: _.map(history, 'P0'),
        beingSampled: _.chain(ongoing)
          .values()
          .map(tDpar)
          .flatten()
          .value(),
      });
      const iId = newId();
      run('rlang', script, {}, r.action('i-done', '/cat/:cHash/iter/t/:iId', { iId }));
      await r.store('/:proj/results/cat/:cHash/iterate', iId);
      await r.incr({ '/iter/calc': 1 });
    }
  });

  petri.register({
    name: 'i-done',
    external: true,
    root: '/cat/:cHash/iter/t/:iId',
  }, async (r, payload) => {
    if (await r.decr({ '../../calc': 1 })) {
      const cVars = await r.retrive('/:proj/hashs/cHash/:cHash').json();
      const rst = parse(payload);
      if (!rst) {
        logger.error('Iter calc failed', payload);
        await r.incr({ '../../../failure': 1, '../../../../@': 1 });
        return;
      }
      logger.debug('Iter succeed', rst);
      const [pars] = rst;
      const vard = _.mapValues(cVars, (v, k) =>
        _.get(_.filter(r.cfg.D, { name: k }), [0, 'descriptions', v - 1], v));
      const dpars = _.assign({}, cVars, pars);
      const dHash = hash(dpars);
      const ongoing = await r.retrive('/:proj/results/cat/:cHash/ongoing').json();
      ongoing[dHash] = dpars;
      logger.info(`Will create eval ${dHash}`, _.assign({}, vard, pars));
      await r.store('/:proj/hashs/dHash/:dHash', { dHash }, dpars);
      await r.incr({ '../../../eval/:dHash/init': 1 }, { dHash });
    }
  });
};
