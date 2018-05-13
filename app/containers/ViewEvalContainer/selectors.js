import { createSelector } from 'reselect';

export const Error = () => createSelector(
  (state) => state.getIn(['viewEvalContainer', 'error']),
  (state) => state && state.toJS(),
);
