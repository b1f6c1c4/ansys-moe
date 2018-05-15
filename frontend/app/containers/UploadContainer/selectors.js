import _ from 'lodash';
import { createSelector } from 'reselect';

export const Files = () => createSelector(
  (state) => state.getIn(['uploadContainer', 'files']),
  (state) => state.getIn(['uploadContainer', 'uploaded']),
  (files, uploaded) => files && _.filter(files.toJS(), { dir: false }).map((file) => ({
    old: uploaded.get(`upload/${file.name}`),
    ...file,
    name: `upload/${file.name}`,
  })),
);

export const Error = () => createSelector(
  (state) => state.getIn(['uploadContainer', 'error']),
  (state) => state && state.toJS(),
);
