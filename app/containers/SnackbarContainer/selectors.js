import { createSelector } from 'reselect';

export const Message = () => createSelector(
  (state) => state.getIn(['snackbarContainer', 'message']),
  (state) => state && state.toJS(),
);
