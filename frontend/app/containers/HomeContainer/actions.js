import * as HOME_CONTAINER from './constants';

// Actions

export function create() {
  return {
    type: HOME_CONTAINER.CREATE_ACTION,
  };
}

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

export function purgeRequest() {
  return {
    type: HOME_CONTAINER.PURGE_REQUEST,
  };
}

export function purgeSuccess(result) {
  return {
    type: HOME_CONTAINER.PURGE_SUCCESS,
    result,
  };
}

export function purgeFailure(error) {
  return {
    type: HOME_CONTAINER.PURGE_FAILURE,
    error,
  };
}
