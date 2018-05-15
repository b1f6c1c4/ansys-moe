import { createSelector } from 'reselect';

export const Form = () => createSelector(
  (state) => state.getIn(['runContainer', 'form']),
  (state) => state && state.toJS(),
);

export const Error = () => createSelector(
  (state) => state.getIn(['runContainer', 'error']),
  (state) => state && state.toJS(),
);
