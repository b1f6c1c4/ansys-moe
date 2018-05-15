import { createSelector } from 'reselect';

export const Error = () => createSelector(
  (state) => state.getIn(['homeContainer', 'error']),
  (state) => state && state.toJS(),
);

export const Rabbit = () => createSelector(
  (state) => state.getIn(['homeContainer', 'rabbit']),
  (state) => state && state.toJS(),
);
