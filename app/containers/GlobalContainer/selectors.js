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
  evalGep: '/p/:proj/state/cat/:cHash/eval/:dHash/:gep=G|E|P',
  evalM: '/p/:proj/state/cat/:cHash/eval/:dHash/M/solve',
  evalP0: '/p/:proj/results/d/:dHash/P0',
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
        'evalM',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, 'Mrun'], token);
        },
      ], [
        'evalGep',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, `${m.gep}run`], token);
        },
      ], [
        'evalP0',
        (m) => {
          _.set(projects, [m.proj, 'results', 'd', m.dHash, 'P0'], value);
        },
      ], [
        'catEval',
        (m) => {
          _.set(projects, [m.proj, 'cat', m.cHash, 'run'], token);
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
          } else if (e.G) {
            _.set(e, 'status', 'Grun');
          } else if (e.M) {
            _.set(e, 'status', 'Mrun');
          } else if (e.E) {
            _.set(e, 'status', 'Erun');
          } else if (e.P) {
            _.set(e, 'status', 'Prun');
          } else if (p.results.d[dHash].P0) {
            _.set(e, 'status', 'done');
          } else {
            _.set(e, 'status', 'out');
          }
          return e;
        });
        return cat;
      });
      return p;
    });
  },
);
