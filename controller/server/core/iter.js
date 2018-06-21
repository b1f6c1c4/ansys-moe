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
const { hash, newId, cIdGen, dedent } = require('../util');
const amqp = require('../amqp');
const { cancel, parse } = require('../integration');

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
      r.logger.debug('Evals not enough');
      return;
    }
    // Check if concurrent evals are enough
    if (await r.ensure('/eval/#') >= r.cfg.concurrent) {
      r.logger.debug('Enough concurrent evals');
      return;
    }
    // Cancel ongoing iter calculation
    if (await r.decr({ '/iter/calc': 1 })) {
      r.logger.warn('Detected old eval');
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
    const gp = await r.retrieve('/p/:proj/results/cat/:cHash/gp').json();
    const gpHash = hash(history, true);
    let script;
    const beingSampled = _.chain(ongoing)
      .values()
      .map(tDpar)
      .flatten()
      .value();
    if (gp && gpHash in gp) {
      r.logger.trace('GPfit cache hit', gpHash);
      const gpq = JSON.stringify(gp[gpHash]);
      const gpQuoted = gpq.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      script = _.template(dedent`
        sink(stderr());
        source("R/ei.R");
        library(jsonlite);
        rngs <- c(<%= rngs.join(', ') %>);
        <% if (beingSampled.length) { %>
          being_sampled <- t(matrix(c(<%= beingSampled.join(', ') %>), nrow=<%= rngs.length %>));
        <% } else { %>
          being_sampled <- NULL
        <% } %>
        obj <- unserializeJSON("<%= gpQuoted %>");
        rst <- eiopt(rngs, obj, being_sampled);
        sink();
        print(toJSON(rst, digits=NA));
      `)({
        rngs,
        gpQuoted,
        beingSampled,
      });
    } else {
      r.logger.debug('GPfit cache invalidated', gpHash);
      const sampled = _.chain(history)
        .map('D')
        .map(tDpar)
        .flatten()
        .value();
      script = _.template(dedent`
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
        obj <- gpfit(sampled, values);
        rst <- eiopt(rngs, obj, being_sampled);
        sink();
        print(toJSON(rst, digits=NA));
        print(serializeJSON(obj));
      `)({
        rngs,
        values: _.map(history, 'P0').map((v) => v === null ? defaultValue : v),
        sampled,
        beingSampled,
      });
    }
    const iId = newId();
    r.logger.debug('Iter calculation started', iId);
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
        r.logger.debug('Iter properly cancelled');
      } else {
        r.logger.warn('iId not match, drop result');
      }
      return;
    }
    await r.decr({ '../../calc': 1 });
    const rst = parse(payload, false);
    const ongoing = await r.retrieve('/p/:proj/results/cat/:cHash/ongoing').json();
    if (!rst) {
      if (_.keys(ongoing).length) {
        r.logger.warn('Iter calc failed', payload);
      } else {
        r.logger.error('Iter calc failed', payload);
        await r.incr({ '../../../error': 1 });
      }
      return;
    }
    r.logger.debug('Iter succeed', rst);
    const history = await r.retrieve('/p/:proj/results/cat/:cHash/history').json();
    if (rst[1]) {
      const gpHash = hash(history, true);
      const gp = { [gpHash]: rst[1] };
      await r.store('/p/:proj/results/cat/:cHash/gp', gp);
      r.logger.debug('GPfit cache updated', gpHash);
    }
    const nextPoint = rst[0].x;
    const nextEI = rst[0].ei[0];
    if (!_.isNil(r.cfg.minEI) && nextEI < r.cfg.minEI) {
      r.logger.debug('EI not sufficient', {
        x: nextPoint,
        ei: nextEI,
      });
      if (!_.keys(ongoing).length) {
        r.logger.debug('Iteration successfully converged!');
        await r.incr({ '../../../conv': 1 });
      }
      return;
    }
    const cVars = await r.retrieve('/hashs/cHash/:cHash').json();
    const dVars = await r.retrieve('/p/:proj/results/cat/:cHash/D').json();
    const hasDone = (dpar) => _.every(dVars, (d, i) => {
      if (d.kind === 'discrete') {
        const id = ((dpar[d.name] - d.lowerBound) / (d.upperBound - d.lowerBound)) * (d.steps - 1);
        return Math.round(id) === nextPoint[i];
      }
      return Math.abs(dpar[d.name] - ((nextPoint[i] * d.precision) * (d.upperBound - d.lowerBound))) < d.precision;
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
        r.logger.warn('Same eval ongoing or has done');
      } else {
        r.logger.debug('Iteration successfully converged!');
        await r.incr({ '../../../conv': 1 });
      }
      return;
    }
    const pars = _.fromPairs(dVars.map((d, i) => {
      r.logger.silly('in pars', { d, i, np: nextPoint[i] });
      const steps = d.kind === 'discrete'
        ? d.steps
        : Math.ceil(((d.upperBound - d.lowerBound) / d.precision) + 0.5);
      return [d.name, ((nextPoint[i] / (steps - 1)) * (d.upperBound - d.lowerBound)) + d.lowerBound];
    }));
    const dpars = _.assign({}, cVars, pars);
    const dHash = hash(dpars);
    ongoing[dHash] = dpars;
    r.logger.info(`Will create eval ${dHash}`, dpars);
    await r.store('/hashs/dHash/:dHash', { dHash }, dpars);
    await r.store('/p/:proj/results/cat/:cHash/ongoing', ongoing);
    await r.store('/p/:proj/results/d/:dHash/ei', { dHash }, nextEI);
    await r.incr({
      '../../../iter/hint': 1,
      '../../../eval/#': 1,
      '../../../eval/:dHash/init': 1,
    }, { dHash });
  });
};
