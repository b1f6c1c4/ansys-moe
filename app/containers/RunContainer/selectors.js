import { createSelector } from 'reselect';

export const Error = () => createSelector(
  (state) => state.getIn(['runContainer', 'error']),
  (state) => state && state.toJS(),
);
