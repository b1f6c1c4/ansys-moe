import { fromJS } from 'immutable';

import * as LOGIN_CONTAINER from './constants';

const initialState = fromJS({
  activeId: 0,
  isLoading: false,
});

function loginContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case LOGIN_CONTAINER.CHANGE_ACTIVE_ID_ACTION:
      return state.set('activeId', action.value);
    // Sagas
    case LOGIN_CONTAINER.LOGIN_REQUEST:
      return state.set('isLoading', true);
    case LOGIN_CONTAINER.LOGIN_SUCCESS:
      return state.set('isLoading', false);
    case LOGIN_CONTAINER.LOGIN_FAILURE:
      return state.set('isLoading', false);
    case LOGIN_CONTAINER.REGISTER_REQUEST:
      return state.set('isLoading', true);
    case LOGIN_CONTAINER.REGISTER_SUCCESS:
      return state.set('isLoading', false);
    case LOGIN_CONTAINER.REGISTER_FAILURE:
      return state.set('isLoading', false);
    // Default
    default:
      return state;
  }
}

export default loginContainerReducer;
