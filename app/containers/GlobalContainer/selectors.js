import _ from 'lodash';
import { createSelector } from 'reselect';
import CompiledPath from 'utils/path';

const compiled = _.mapValues({
  hash: '/hashs/:kind/:hash',
  projConfig: '/p/:proj/config',
  projError: '/p/:proj/state/error',
  projDone: '/p/:proj/state/done',
  catError: '/p/:proj/state/cat/:cHash/error',
  catInit: '/p/:proj/state/cat/:cHash/init',
  catIter: '/p/:proj/state/cat/:cHash/iter/calc',
  catEval: '/p/:proj/state/cat/:cHash/eval',
  catOngoing: '/p/:proj/results/cat/:cHash/ongoing',
  catHistory: '/p/:proj/results/cat/:cHash/history',
  evalError: '/p/:proj/state/cat/:cHash/eval/:dHash/error',
  gepInit: '/p/:proj/state/cat/:cHash/eval/:dHash/:gep=G|E|P/:name/init',
  gepPrep: '/p/:proj/state/cat/:cHash/eval/:dHash/:gep=G|E|P/:name/prep',
  evalGep: '/p/:proj/state/cat/:cHash/eval/:dHash/:gep=G|E|P',
  evalM: '/p/:proj/state/cat/:cHash/eval/:dHash/M/solve',
  gepResult: '/p/:proj/results/d/:dHash/:gep=G|E|P/:name',
  mIdResult: '/p/:proj/results/d/:dHash/Mid',
  mHashResult: '/p/:proj/results/d/:dHash/mHash',
  varResult: '/p/:proj/results/d/:dHash/var',
  mResult: '/results/M/:mHash',
  startResult: '/p/:proj/results/d/:dHash/startTime',
  endResult: '/p/:proj/results/d/:dHash/endTime',
  evalP0Result: '/p/:proj/results/d/:dHash/P0',
}, (p) => (new CompiledPath(p, true)).match);

const run = (arr, key) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [name, func] of arr) {
    const m = compiled[name](key);
    if (m) {
      func(m);
      return;
    }
  }
};

export const ListHash = () => createSelector(
  (state) => state.getIn(['globalContainer', 'etcd']),
  (etcd) => {
    if (!etcd) return null;
    const hashs = {};
    etcd.forEach((value, key) => {
      run([[
        'hash',
        (m) => {
          _.set(hashs, [m.kind, m.hash], JSON.parse(value));
        },
      ]], key);
    });
    return hashs;
  },
);

export const ListProj = () => createSelector(
  (state) => state.getIn(['globalContainer', 'etcd']),
  (etcd) => {
    if (!etcd) return null;
    const projects = {};
    const mResults = {};
    etcd.forEach((value, key) => {
      run([[
        'projConfig',
        (m) => {
          _.set(projects, [m.proj, 'config'], JSON.parse(value));
        },
      ], [
        'projError',
        (m) => {
          _.update(projects, [m.proj, 'error'], (v) => v || +value);
        },
      ], [
        'projDone',
        (m) => {
          _.set(projects, [m.proj, 'done'], +value);
        },
      ], [
        'catError',
        (m) => {
          _.update(projects, [m.proj, 'error'], (v) => v || +value);
          _.update(projects, [m.proj, 'cat', m.cHash, 'error'], (v) => v || +value);
        },
      ], [
        'catInit',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'init'], +value);
        },
      ], [
        'catIter',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'iter'], +value);
        },
      ], [
        'catEval',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'run'], +value);
        },
      ], [
        'catOngoing',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'ongoing'], JSON.parse(value));
        },
      ], [
        'catHistory',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'history'], JSON.parse(value));
        },
      ], [
        'evalError',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, 'error'], +value);
        },
      ], [
        'gepInit',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, m.gep, m.name, 'init'], +value);
        },
      ], [
        'gepPrep',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, m.gep, m.name, 'prep'], +value);
        },
      ], [
        'evalGep',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, `${m.gep}run`], +value);
        },
      ], [
        'evalM',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, 'Mrun'], +value);
        },
      ], [
        'gepResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, m.gep, m.name], +value);
        },
      ], [
        'mIdResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'Mid'], +value);
        },
      ], [
        'mHashResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'mHash'], value);
        },
      ], [
        'varResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'var'], JSON.parse(value));
        },
      ], [
        'mResult',
        (m) => {
          _.set(mResults, [m.mHash], JSON.parse(value));
        },
      ], [
        'startResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'startTime'], new Date(value));
        },
      ], [
        'endResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'endTime'], new Date(value));
        },
      ], [
        'evalP0Result',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'P0'], +value);
        },
      ]], key);
    });
    return _.mapValues(projects, (p) => {
      if (!p.config) {
        _.set(p, 'status', 'init');
        return p;
      }
      if (p.error) {
        _.set(p, 'status', 'error');
      } else if (p.done) {
        _.set(p, 'status', 'done');
      } else {
        _.set(p, 'status', 'running');
      }
      _.mapValues(p.cat, (cat) => {
        if (cat.error) {
          _.set(cat, 'status', 'error');
        } else if (cat.init) {
          _.set(cat, 'status', 'init');
        } else if (cat.iter) {
          _.set(cat, 'status', 'iter');
        } else if (cat.run) {
          _.set(cat, 'status', 'running');
        } else {
          _.set(cat, 'status', 'done');
        }
        _.mapValues(cat.eval, (e, dHash) => {
          _.set(e, 'P0', _.get(p, ['results', 'd', dHash, 'P0']));
          _.set(e, 'var', _.get(p, ['results', 'd', dHash, 'var']));
          _.set(e, 'startTime', _.get(p, ['results', 'd', dHash, 'startTime']));
          _.set(e, 'endTime', _.get(p, ['results', 'd', dHash, 'endTime']));
          if (e.error) {
            _.set(e, 'status', 'error');
          } else if (e.Grun) {
            _.set(e, 'status', 'Grun');
          } else if (e.Mrun) {
            _.set(e, 'status', 'Mrun');
          } else if (e.Erun) {
            _.set(e, 'status', 'Erun');
          } else if (e.Prun) {
            _.set(e, 'status', 'Prun');
          } else if (e.P0 !== undefined) {
            _.set(e, 'status', 'done');
          } else {
            _.set(e, 'status', 'out');
          }
          const gepFunc = (kind) => (geps) => _.fromPairs(_.map(p.config[kind], (cfg) => {
            const v = _.get(p, ['results', 'd', dHash, kind, cfg.name]);
            const gep = _.assign({}, _.get(geps, [cfg.name]));
            _.set(gep, 'value', v);
            if (gep.prep) {
              _.set(gep, 'status', 'running');
            } else if (v === undefined) {
              _.set(gep, 'status', 'waiting');
            } else if (!_.isNil(cfg.lowerBound) && v < cfg.lowerBound) {
              _.set(gep, 'status', 'out');
            } else if (!_.isNil(cfg.upperBound) && v > cfg.upperBound) {
              _.set(gep, 'status', 'out');
            } else {
              _.set(gep, 'status', 'done');
            }
            _.set(gep, 'cfg', cfg);
            return [cfg.name, gep];
          }));
          _.update(e, 'G', gepFunc('G'));
          const mId = _.get(p, ['results', 'd', dHash, 'Mid']);
          const mHash = _.get(p, ['results', 'd', dHash, 'mHash']);
          _.set(e, 'mId', mId);
          _.set(e, 'mHash', mHash);
          if (mId !== undefined) {
            const config = p.config.ansys.rules[mId];
            _.set(e, 'config', config);
            _.set(e, 'Mdown', !!_.get(mResults, [mHash]));
            _.set(e, 'M', _.fromPairs(config.outputs.map((rule) => {
              const v = _.get(mResults, [mHash, rule.name]);
              let status;
              if (v === undefined) {
                status = 'running';
              } else if (!_.isNil(rule.lowerBound) && v < rule.lowerBound) {
                status = 'out';
              } else if (!_.isNil(rule.upperBound) && v > rule.upperBound) {
                status = 'out';
              } else {
                status = 'done';
              }
              return [rule.name, { rule, status, value: v }];
            })));
          }
          _.update(e, 'E', gepFunc('E'));
          _.update(e, 'P', gepFunc('P'));
          return e;
        });
        const opt = _.minBy(_.values(cat.eval), 'P0');
        if (opt) {
          _.set(cat, 'optimal', opt.P0);
          _.set(opt, 'isOptimal', true);
        }
        return cat;
      });
      const opt = _.minBy(_.values(p.cat), 'optimal');
      if (opt) {
        _.set(p, 'optimal', opt.optimal);
        _.set(opt, 'isOptimal', true);
      }
      return p;
    });
  },
);
