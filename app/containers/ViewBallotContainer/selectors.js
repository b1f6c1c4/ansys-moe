import { createSelector } from 'reselect';

export const Ballot = () => createSelector(
  (state) => state.getIn(['viewBallotContainer', 'ballot']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['viewBallotContainer', 'error']),
  (state) => state && state.toJS(),
);
