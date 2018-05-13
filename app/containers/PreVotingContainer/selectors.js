import { createSelector } from 'reselect';

export const Ballot = () => createSelector(
  (state) => state.getIn(['preVotingContainer', 'ballot']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['preVotingContainer', 'error']),
  (state) => state && state.toJS(),
);

export const Fields = () => createSelector(
  (state) => state.getIn(['preVotingContainer', 'fields']),
  (state) => state && state.toJS(),
);

export const Ticket = () => createSelector(
  (state) => state.getIn(['preVotingContainer', 'ticket']),
  (state) => state && state.toJS(),
);
