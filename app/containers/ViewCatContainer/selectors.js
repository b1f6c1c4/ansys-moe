import { createSelector } from 'reselect';

export const Error = () => createSelector(
  (state) => state.getIn(['viewCatContainer', 'error']),
  (state) => state && state.toJS(),
);
