const _ = require('lodash');
const { hash, newId, cIdGen, dedent } = require('../util');
const amqp = require('../amqp');
const { cancel, parse } = require('../integration');
const logger = require('../logger')('core/iter');

module.exports = (petri) => {
  petri.register({
    name: 'i-new-hint',
    external: true,
    root: '/cat/:cHash',
    pre: {
      lte: { '/error': 0, '../../error': 0 },
    },
  }, async (r) => {
    await r.incr({ '/iter/hint': 1 });
  });

  petri.register({
    name: 'i-hint',
    root: '/cat/:cHash',
    pre: {
      lte: { '/error': 0, '../../error': 0 },
      decr: { '/iter/hint': 1 },
    },
  }, async (r) => {
    if (await r.ensure('/iter/req') === 0 && await r.ensure('/iter/calc') === 0) {
      await r.incr({ '/iter/req': 1 });
    }
  });

  petri.register({
    name: 'i-req',
    root: '/cat/:cHash',
    pre: {
      lte: { '/error': 0, '../../error': 0 },
      gte: { '/eval': 1 },
      decr: { '/iter/req': 1 },
    },
  }, async (r) => {
    // Check if enough evals have done
    if (await r.ensure('/eval/@') < r.cfg.minEvals) {
      logger.debug('Evals not enough');
      return;
    }
    // Check if concurrent evals are enough
    if (await r.ensure('/eval/#') >= r.cfg.concurrent) {
      logger.debug('Enough concurrent evals');
      return;
    }
    // Cancel ongoing iter calculation
    if (await r.decr({ '/iter/calc': 1 })) {
      logger.warn('Detected old eval');
      const iId = await r.retrieve('/p/:proj/results/cat/:cHash/iterate').string();
      cancel('rlang', r.action('i-done', '/cat/:cHash/iter/t/:iId', { iId }));
    }

    // Run iter calculation
    const defaultValue = r.cfg.P0.default === undefined ? 0 : r.cfg.P0.default;
    const dVars = await r.retrieve('/p/:proj/results/cat/:cHash/D').json();
    const rngs = dVars.map((d) => {
      if (d.kind === 'discrete') {
        return d.steps;
      }
      return Math.ceil((d.upperBound - d.lowerBound) / d.precision);
    });
    const tDpar = (dpar) => dVars.map(({ name, lowerBound, upperBound }) =>
      (dpar[name] - lowerBound) / (upperBound - lowerBound));
    const history = await r.retrieve('/p/:proj/results/cat/:cHash/history').json();
    const ongoing = await r.retrieve('/p/:proj/results/cat/:cHash/ongoing').json();
    const sampled = _.chain(history)
      .map('D')
      .map(tDpar)
      .flatten()
      .value();
    const beingSampled = _.chain(ongoing)
      .values()
      .map(tDpar)
      .flatten()
      .value();
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
      values: _.map(history, 'P0').map((v) => v === null ? defaultValue : v),
      sampled,
      beingSampled,
    });
    const iId = newId();
    logger.debug('Iter calculation started', iId);
    amqp.publish(
      'rlang',
      { script },
      cIdGen(r.action('i-done', '/cat/:cHash/iter/t/:iId', { iId })),
      { cfg: r.cfgHash('i-done') },
    );
    await r.store('/p/:proj/results/cat/:cHash/iterate', iId);
    await r.incr({ '/iter/calc': 1 });
  });

  petri.register({
    name: 'i-done',
    external: true,
    root: '/cat/:cHash/iter/t/:iId',
    pre: {
      lte: { '/error': 0, '../../error': 0 },
      gte: { '../../calc': 1 },
    },
  }, async (r, payload) => {
    if (r.param.iId !== await r.retrieve('/p/:proj/results/cat/:cHash/iterate').string()) {
      if (payload.action.type === 'cancel') {
        logger.debug('Iter properly cancelled');
      } else {
        logger.warn('iId not match, drop result');
      }
      return;
    }
    await r.decr({ '../../calc': 1 });
    const rst = parse(payload, false);
    const ongoing = await r.retrieve('/p/:proj/results/cat/:cHash/ongoing').json();
    if (!rst) {
      if (_.keys(ongoing).length) {
        logger.warn('Iter calc failed', payload);
      } else {
        logger.error('Iter calc failed', payload);
        await r.incr({ '../../../error': 1 });
      }
      return;
    }
    logger.debug('Iter succeed', rst);
    const cVars = await r.retrieve('/hashs/cHash/:cHash').json();
    const dVars = await r.retrieve('/p/:proj/results/cat/:cHash/D').json();
    const history = await r.retrieve('/p/:proj/results/cat/:cHash/history').json();
    const hasDone = (dpar) => _.every(dVars, (d, i) => {
      if (d.kind === 'discrete') {
        const id = ((dpar[d.name] - d.lowerBound) / (d.upperBound - d.lowerBound)) * (d.steps - 1);
        return Math.round(id) === rst[0][i];
      }
      return Math.abs(dpar[d.name] - ((rst[0][i] * d.precision) * (d.upperBound - d.lowerBound))) < d.precision;
    });
    const hisDone = _.chain(history)
      .map('D')
      .some(hasDone)
      .value();
    const ongDone = _.chain(ongoing)
      .values()
      .some(hasDone)
      .value();
    if (hisDone || ongDone) {
      if (_.keys(ongoing).length) {
        logger.warn('Same eval ongoing or has done');
      } else {
        logger.debug('Iteration successfully converged!');
        await r.incr({ '../../../conv': 1 });
      }
      return;
    }
    const pars = _.fromPairs(dVars.map((d, i) => {
      if (d.kind === 'discrete') {
        return [d.name, ((rst[0][i] / (d.steps - 1)) * (d.upperBound - d.lowerBound)) + d.lowerBound];
      }
      return [d.name, ((rst[0][i] * d.precision) * (d.upperBound - d.lowerBound)) + d.lowerBound];
    }));
    const vard = _.mapValues(cVars, (v, k) =>
      _.get(_.filter(r.cfg.D, { name: k }), [0, 'descriptions', v - 1], v));
    const dpars = _.assign({}, cVars, pars);
    const dHash = hash(dpars);
    ongoing[dHash] = dpars;
    logger.info(`Will create eval ${dHash}`, _.assign({}, vard, pars));
    await r.store('/hashs/dHash/:dHash', { dHash }, dpars);
    await r.incr({ '../../../eval/:dHash/init': 1 }, { dHash });
    await r.incr({ '/iter/hint': 1 });
  });
};