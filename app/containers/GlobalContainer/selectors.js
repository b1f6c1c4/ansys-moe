import { createSelector } from 'reselect';

export const ListBallots = () => createSelector(
  (state) => state.getIn(['globalContainer', 'listBallots']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['globalContainer', 'error']),
  (state) => state && state.toJS(),
);
