import { createSelector } from 'reselect';

export const Ballot = () => createSelector(
  (state) => state.getIn(['voterRegContainer', 'ballot']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['voterRegContainer', 'error']),
  (state) => state && state.toJS(),
);
