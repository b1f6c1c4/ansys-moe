import * as RUN_CONTAINER from './constants';

// Actions

// Sagas
export function runRequest() {
  return {
    type: RUN_CONTAINER.RUN_REQUEST,
  };
}

export function runSuccess(result) {
  return {
    type: RUN_CONTAINER.RUN_SUCCESS,
    result,
  };
}

export function runFailure(error) {
  return {
    type: RUN_CONTAINER.RUN_FAILURE,
    error,
  };
}
