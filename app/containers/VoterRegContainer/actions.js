import * as VOTER_REG_CONTAINER from './constants';

// Actions

export function statusRequest() {
  return {
    type: VOTER_REG_CONTAINER.STATUS_REQUEST_ACTION,
  };
}

// Sagas
export function registerRequest({ bId, iCode, comment }) {
  return {
    type: VOTER_REG_CONTAINER.REGISTER_REQUEST,
    bId,
    iCode,
    comment,
  };
}

export function registerSuccess(result, { privateKey }) {
  return {
    type: VOTER_REG_CONTAINER.REGISTER_SUCCESS,
    result,
    privateKey,
  };
}

export function registerFailure(error) {
  return {
    type: VOTER_REG_CONTAINER.REGISTER_FAILURE,
    error,
  };
}

export function refreshRequest({ bId }) {
  return {
    type: VOTER_REG_CONTAINER.REFRESH_REQUEST,
    bId,
  };
}

export function refreshSuccess(result) {
  return {
    type: VOTER_REG_CONTAINER.REFRESH_SUCCESS,
    result,
  };
}

export function refreshFailure(error) {
  return {
    type: VOTER_REG_CONTAINER.REFRESH_FAILURE,
    error,
  };
}
