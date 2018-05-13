import { fromJS } from 'immutable';

import * as VIEW_CAT_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
});

function viewCatContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    // Sagas
    case VIEW_CAT_CONTAINER.STOP_REQUEST:
      return state.set('isLoading', true);
    case VIEW_CAT_CONTAINER.STOP_SUCCESS:
      return state.set('isLoading', false);
    case VIEW_CAT_CONTAINER.STOP_FAILURE:
      return state.set('isLoading', false);
    // Default
    default:
      return state;
  }
}

export default viewCatContainerReducer;
