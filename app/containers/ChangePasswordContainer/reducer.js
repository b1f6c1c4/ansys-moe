import { fromJS } from 'immutable';

import * as CHANGE_PASSWORD_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
});

function changePasswordContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    // Sagas
    case CHANGE_PASSWORD_CONTAINER.PASSWORD_REQUEST:
      return state.set('isLoading', true);
    case CHANGE_PASSWORD_CONTAINER.PASSWORD_SUCCESS:
      return state.set('isLoading', false);
    case CHANGE_PASSWORD_CONTAINER.PASSWORD_FAILURE:
      return state.set('isLoading', false);
    // Default
    default:
      return state;
  }
}

export default changePasswordContainerReducer;
