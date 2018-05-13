import _ from 'lodash';
import { fromJS } from 'immutable';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as GLOBAL_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  isDrawerOpen: false,
  isAccountOpen: false,
  credential: null,
  listBallots: null,
  error: null,
});

function globalContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case GLOBAL_CONTAINER.OPEN_DRAWER_ACTION:
      return state.set('isDrawerOpen', true);
    case GLOBAL_CONTAINER.CLOSE_DRAWER_ACTION:
      return state.set('isDrawerOpen', false);
    case GLOBAL_CONTAINER.OPEN_ACCOUNT_ACTION:
      return state.set('isAccountOpen', true);
    case GLOBAL_CONTAINER.CLOSE_ACCOUNT_ACTION:
      return state.set('isAccountOpen', false);
    case GLOBAL_CONTAINER.LOGIN_ACTION:
      return state.set('credential', fromJS(action.credential));
    case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION: {
      const list = state.get('listBallots');
      if (!list) return state;
      const id = list.findIndex((b) => b.get('bId') === action.bId);
      if (id === -1) return state;
      const newList = list.update(id, (b) => b.set('status', action.status));
      return state.set('listBallots', newList);
    }
    // Sagas
    case GLOBAL_CONTAINER.BALLOTS_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case GLOBAL_CONTAINER.BALLOTS_SUCCESS:
      return state.set('isLoading', false)
        .set('error', null)
        .set('listBallots', fromJS(action.result.ballots));
    case GLOBAL_CONTAINER.BALLOTS_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default globalContainerReducer;
