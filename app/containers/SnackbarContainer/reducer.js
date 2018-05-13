import { fromJS } from 'immutable';

import * as SNACKBAR_CONTAINER from './constants';

const initialState = fromJS({
  isOpen: false,
  message: null,
});

function snackbarContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case SNACKBAR_CONTAINER.SNACKBAR_SHOW_ACTION:
      return state.set('isOpen', true)
        .set('message', fromJS(action.message));
    case SNACKBAR_CONTAINER.SNACKBAR_HIDE_ACTION:
      return state.set('isOpen', false);
    // Sagas
    // Default
    default:
      return state;
  }
}

export default snackbarContainerReducer;
