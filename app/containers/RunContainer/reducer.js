import { fromJS } from 'immutable';

import * as RUN_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
});

function runContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    // Sagas
    case RUN_CONTAINER.RUN_REQUEST:
      return state.set('isLoading', true);
    case RUN_CONTAINER.RUN_SUCCESS:
      return state.set('isLoading', false);
    case RUN_CONTAINER.RUN_FAILURE:
      return state.set('isLoading', false);
    // Default
    default:
      return state;
  }
}

export default runContainerReducer;
