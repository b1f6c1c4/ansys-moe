import * as HOME_CONTAINER from './constants';

// Actions

// Sagas
export function statusRequest() {
  return {
    type: HOME_CONTAINER.STATUS_REQUEST,
  };
}

export function statusSuccess(result) {
  return {
    type: HOME_CONTAINER.STATUS_SUCCESS,
    result,
  };
}

export function statusFailure(error) {
  return {
    type: HOME_CONTAINER.STATUS_FAILURE,
    error,
  };
}

export function startRequest() {
  return {
    type: HOME_CONTAINER.START_REQUEST,
  };
}

export function startFailure(error) {
  return {
    type: HOME_CONTAINER.START_FAILURE,
    error,
  };
}
