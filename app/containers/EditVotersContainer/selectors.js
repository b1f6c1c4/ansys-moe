import { createSelector } from 'reselect';

export const Voters = () => createSelector(
  (state) => state.getIn(['editVotersContainer', 'voters']),
  (state) => state && state.toJS(),
);

export const Ballot = () => createSelector(
  (state) => state.getIn(['editVotersContainer', 'ballot']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['editVotersContainer', 'error']),
  (state) => state && state.toJS(),
);
