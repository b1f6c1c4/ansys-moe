import { fromJS } from 'immutable';

import * as CREATE_BALLOT_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
});

function createBallotContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    // Sagas
    case CREATE_BALLOT_CONTAINER.CREATE_BALLOT_REQUEST:
      return state.set('isLoading', true);
    case CREATE_BALLOT_CONTAINER.CREATE_BALLOT_SUCCESS:
      return state.set('isLoading', false);
    case CREATE_BALLOT_CONTAINER.CREATE_BALLOT_FAILURE:
      return state.set('isLoading', false);
    // Default
    default:
      return state;
  }
}

export default createBallotContainerReducer;
