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
  gmepResult: '/p/:proj/results/d/:dHash/:gmep=G|M|E|P/:name',
  mIdResult: '/p/:proj/results/d/:dHash/Mid',
  varResult: '/p/:proj/results/d/:dHash/var',
  evalP0Result: '/p/:proj/results/d/:dHash/P0',
}, (p) => (new CompiledPath(p)).match);

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
    etcd.forEach((value, key) => {
      const token = parseInt(value, 10);
      run([[
        'projConfig',
        (m) => {
          _.set(projects, [m.proj, 'config'], JSON.parse(value));
        },
      ], [
        'projError',
        (m) => {
          _.update(projects, [m.proj, 'error'], (v) => v || token);
        },
      ], [
        'projDone',
        (m) => {
          _.set(projects, [m.proj, 'done'], token);
        },
      ], [
        'catError',
        (m) => {
          _.update(projects, [m.proj, 'error'], (v) => v || token);
          _.update(projects, [m.proj, 'cat', m.cHash, 'error'], (v) => v || token);
        },
      ], [
        'catInit',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'init'], token);
        },
      ], [
        'catIter',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'iter'], token);
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
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, 'error'], token);
        },
      ], [
        'gepInit',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, m.gep, m.name, 'init'], token);
        },
      ], [
        'gepPrep',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, m.gep, m.name, 'prep'], token);
        },
      ], [
        'evalGep',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, `${m.gep}run`], token);
        },
      ], [
        'evalM',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, 'Mrun'], token);
        },
      ], [
        'catEval',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'run'], token);
        },
      ], [
        'gmepResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, m.gmep, m.name], value);
        },
      ], [
        'mIdResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'Mid'], token);
        },
      ], [
        'varResult',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'var'], JSON.parse(value));
        },
      ], [
        'evalP0Result',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'P0'], value);
        },
      ]], key);
    });
    return _.mapValues(projects, (p) => {
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
          } else if (_.get(p, ['results', 'd', dHash, 'P0']) !== undefined) {
            _.set(e, 'status', 'done');
          } else {
            _.set(e, 'status', 'out');
          }
          const gepFunc = (kind) => (gep, name) => {
            const v = _.get(p, ['results', 'd', dHash, kind, name]);
            const cfg = _.find(p.config[kind], { name });
            _.set(gep, 'value', v);
            if (gep.init) {
              _.set(gep, 'status', 'waiting');
            } else if (gep.prep) {
              _.set(gep, 'status', 'running');
            } else if (v === undefined) {
              _.set(gep, 'status', 'done');
            } else if (!_.isNil(cfg.lowerBound) && v < cfg.lowerBound) {
              _.set(gep, 'status', 'out');
            } else if (!_.isNil(cfg.upperBound) && v > cfg.upperBound) {
              _.set(gep, 'status', 'out');
            } else {
              _.set(gep, 'status', 'done');
            }
          };
          _.mapValues(e.G, gepFunc('G'));
          const mId = _.get(p, ['results', 'd', dHash, 'Mid']);
          if (mId !== undefined) {
            _.set(e, 'M', _.fromPairs(p.config.ansys.rules[mId].outputs.map((rule) => {
              const v = _.get(p, ['results', 'd', dHash, 'M', rule.name]);
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
          _.mapValues(e.E, gepFunc('E'));
          _.mapValues(e.P, gepFunc('P'));
          return e;
        });
        return cat;
      });
      return p;
    });
  },
);
