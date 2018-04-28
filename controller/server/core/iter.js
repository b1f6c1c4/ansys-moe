const _ = require('lodash');
const { hash, newId, dedent } = require('../util');
const amqp = require('../amqp');
const { getId, cancel, parse } = require('../integration');
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
        logger.warn('Category quited');
        return;
      }
      // Check if enough evals have done
      if (await r.ensure('/eval/@') < r.cfg.minEvals) {
        logger.warn('Evals not enough');
        return;
      }
      const concurrent = await r.retrive('/:proj/concurrent').number();
      // Check if concurrent evals are enough
      if (await r.ensure('/eval/#') >= concurrent) {
        logger.warn('Enough concurrent evals');
        return;
      }
      // Cancel ongoing iter calculation
      if (await r.decr({ '/iter/calc': 1 })) {
        // TODO: check hash
        logger.warn('Detected old eval');
        const oldId = await r.retrive('/:proj/results/cat/:cHash/iterate').string();
        cancel('rlang', oldId);
      }

      // Run iter calculation
      const disDVars = await r.retrive('/:proj/results/cat/:cHash/D').json();
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
        <% if (beingSampled.length) { %>
          being_sampled <- t(matrix(c(<%= beingSampled.join(', ') %>), nrow=<%= rngs.length %>));
        <% } else { %>
          being_sampled <- NULL
        <% } %>
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
      logger.info('Iter calculation started', iId);
      amqp.publish(
        'rlang',
        { script },
        getId(r.action('i-done', '/cat/:cHash/iter/t/:iId', { iId })),
      );
      await r.store('/:proj/results/cat/:cHash/iterate', iId);
      await r.incr({ '/iter/calc': 1 });
    }
  });

  petri.register({
    name: 'i-done',
    external: true,
    root: '/cat/:cHash/iter/t/:iId',
  }, async (r, payload) => {
    if (await r.ensure('../../calc')) {
      if (r.param.iId !== await r.retrive('/:proj/results/cat/:cHash/iterate').string()) {
        logger.warn('iId not match, drop result');
        return;
      }
      await r.decr({ '../../calc': 1 });
      const rst = parse(payload, false);
      if (!rst) {
        logger.error('Iter calc failed', payload);
        await r.incr({ '../../../failure': 1, '../../../../@': 1 });
        return;
      }
      logger.info('Iter succeed', rst);
      const cVars = await r.retrive('/:proj/hashs/cHash/:cHash').json();
      const disDVars = await r.retrive('/:proj/results/cat/:cHash/D').json();
      const pars = _.fromPairs(disDVars.map((v, i) => [v.name, rst[0][i]]));
      const vard = _.mapValues(cVars, (v, k) =>
        _.get(_.filter(r.cfg.D, { name: k }), [0, 'descriptions', v - 1], v));
      const dpars = _.assign({}, cVars, pars);
      const dHash = hash(dpars);
      const ongoing = await r.retrive('/:proj/results/cat/:cHash/ongoing').json();
      ongoing[dHash] = dpars;
      logger.info(`Will create eval ${dHash}`, _.assign({}, vard, pars));
      await r.store('/:proj/hashs/dHash/:dHash', { dHash }, dpars);
      await r.incr({ '../../../eval/:dHash/init': 1 }, { dHash });
      // TODO: loop
      // await r.incr({ '/iter/req': 1 });
    }
  });
};
