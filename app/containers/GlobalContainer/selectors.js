import _ from 'lodash';
import { createSelector } from 'reselect';
import CompiledPath from 'utils/path';

const compiled = _.mapValues({
  projError: '/p/:proj/state/error',
  projDone: '/p/:proj/state/done',
  catError: '/p/:proj/state/cat/:cHash/error',
  catIter: '/p/:proj/state/cat/:cHash/iter/calc',
  evalError: '/p/:proj/state/cat/:cHash/eval/:dHash/error',
}, (p) => (new CompiledPath(p)).match);

export const ListProj = () => createSelector(
  (state) => state.getIn(['globalContainer', 'etcd']),
  (etcd) => {
    if (!etcd) return null;
    const projects = {};
    etcd.forEach((value, key) => {
      /* eslint-disable no-useless-return */
      let m;
      const token = parseInt(value, 10);
      m = compiled.projError(key);
      if (m) {
        _.update(projects, [m.proj, 'error'], (v) => v || token);
        return;
      }
      m = compiled.projDone(key);
      if (m) {
        _.set(projects, [m.proj, 'done'], token);
        return;
      }
      m = compiled.catError(key);
      if (m) {
        _.update(projects, [m.proj, 'error'], (v) => v || token);
        _.update(projects, [m.proj, 'cat', m.cHash, 'error'], (v) => v || token);
        return;
      }
      m = compiled.catIter(key);
      if (m) {
        _.set(projects, [m.proj, 'cat', m.cHash, 'iter'], token);
        return;
      }
      m = compiled.evalError(key);
      if (m) {
        _.set(projects, [m.proj, 'cat', m.cHash, 'eval', m.dHash, 'error'], token);
        return;
      }
      /* eslint-enable no-useless-return */
    });
    return projects;
  },
);
