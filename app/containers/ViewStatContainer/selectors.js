import { createSelector } from 'reselect';

export const Ballot = () => createSelector(
  (state) => state.getIn(['viewStatContainer', 'ballot']),
  (state) => state && state.toJS(),
);

export const Stat = () => createSelector(
  (state) => state.getIn(['viewStatContainer', 'stats']),
  (state) => state.getIn(['viewStatContainer', 'fieldIndex']),
  (stats, index) => {
    if (!stats) return null;
    const obj = stats.get(index);
    return obj && obj.toJS();
  },
);

export const Error = () => createSelector(
  (state) => state.getIn(['viewStatContainer', 'error']),
  (state) => state && state.toJS(),
);
