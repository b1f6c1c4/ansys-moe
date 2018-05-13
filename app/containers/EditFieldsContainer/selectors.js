import { createSelector } from 'reselect';

export const Ballot = () => createSelector(
  (state) => state.getIn(['editFieldsContainer', 'ballot']),
  (state) => state && state.toJS(),
);

export const Fields = () => createSelector(
  (state) => state.getIn(['editFieldsContainer', 'fields']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['editFieldsContainer', 'error']),
  (state) => state && state.toJS(),
);
