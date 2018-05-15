import { createSelector } from 'reselect';

export const Error = () => createSelector(
  (state) => state.getIn(['viewProjContainer', 'error']),
  (state) => state && state.toJS(),
);
