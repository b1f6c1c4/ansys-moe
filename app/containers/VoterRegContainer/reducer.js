import _ from 'lodash';
import { fromJS } from 'immutable';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as VOTER_REG_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  isRegLoading: false,
  ballot: null,
  error: null,
  privateKey: null,
});

function voterRegContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION:
      if (state.getIn(['ballot', 'bId']) === action.bId) {
        return state.setIn(['ballot', 'status'], action.status);
      }
      return state;
    // Sagas
    case VOTER_REG_CONTAINER.REGISTER_REQUEST:
      return state.set('isRegLoading', true);
    case VOTER_REG_CONTAINER.REGISTER_SUCCESS:
      return state.set('isRegLoading', false)
        .set('privateKey', action.privateKey);
    case VOTER_REG_CONTAINER.REGISTER_FAILURE:
      return state.set('isRegLoading', false);
    case VOTER_REG_CONTAINER.REFRESH_REQUEST:
      return state.set('isLoading', true)
        .set('privateKey', null)
        .set('error', null);
    case VOTER_REG_CONTAINER.REFRESH_SUCCESS:
      return state.set('isLoading', false)
        .set('ballot', fromJS(action.result.ballot));
    case VOTER_REG_CONTAINER.REFRESH_FAILURE:
      return state.set('isLoading', false)
        .set('ballot', null)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default voterRegContainerReducer;
