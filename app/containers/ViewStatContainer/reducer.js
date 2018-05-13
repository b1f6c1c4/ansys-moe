import _ from 'lodash';
import { fromJS } from 'immutable';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as VIEW_STAT_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  isStatsLoading: false,
  ballot: null,
  error: null,
  stats: null,
  fieldIndex: 0,
});

function viewStatContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION:
      if (state.getIn(['ballot', 'bId']) === action.bId) {
        return state.setIn(['ballot', 'status'], action.status);
      }
      return state;
    case VIEW_STAT_CONTAINER.CHANGE_FIELD_ACTION:
      return state.set('fieldIndex', action.index);
    // Sagas
    case VIEW_STAT_CONTAINER.BALLOT_REQUEST:
      return state
        .set('isLoading', true)
        .set('error', null);
    case VIEW_STAT_CONTAINER.BALLOT_SUCCESS:
      return state
        .set('isLoading', false)
        .set('ballot', fromJS(action.result.ballot));
    case VIEW_STAT_CONTAINER.BALLOT_FAILURE:
      return state
        .set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case VIEW_STAT_CONTAINER.STATS_REQUEST:
      return state
        .set('isStatsLoading', true)
        .set('error', null);
    case VIEW_STAT_CONTAINER.STATS_SUCCESS:
      return state
        .set('isStatsLoading', false)
        .set('stats', fromJS(_.map(action.results, 'fieldStat')));
    case VIEW_STAT_CONTAINER.STATS_FAILURE:
      return state
        .set('isStatsLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case VIEW_STAT_CONTAINER.EXPORT_REQUEST:
      return state;
    case VIEW_STAT_CONTAINER.EXPORT_SUCCESS:
      return state;
    case VIEW_STAT_CONTAINER.EXPORT_FAILURE:
      return state
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default viewStatContainerReducer;
