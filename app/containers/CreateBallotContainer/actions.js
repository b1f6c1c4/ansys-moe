import * as CREATE_BALLOT_CONTAINER from './constants';

// Actions

// Sagas
export function createBallotRequest({ name }) {
  return {
    type: CREATE_BALLOT_CONTAINER.CREATE_BALLOT_REQUEST,
    name,
  };
}

export function createBallotSuccess(result) {
  return {
    type: CREATE_BALLOT_CONTAINER.CREATE_BALLOT_SUCCESS,
    result,
  };
}

export function createBallotFailure(error) {
  return {
    type: CREATE_BALLOT_CONTAINER.CREATE_BALLOT_FAILURE,
    error,
  };
}
