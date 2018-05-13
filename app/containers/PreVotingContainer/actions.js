import * as PRE_VOTING_CONTAINER from './constants';

// Actions
export function statusRequest() {
  return {
    type: PRE_VOTING_CONTAINER.STATUS_REQUEST_ACTION,
  };
}

export function signProgress(progress) {
  return {
    type: PRE_VOTING_CONTAINER.SIGN_PROGRESS_ACTION,
    progress,
  };
}

// Sagas
export function refreshRequest({ bId }) {
  return {
    type: PRE_VOTING_CONTAINER.REFRESH_REQUEST,
    bId,
  };
}

export function refreshSuccess(result) {
  return {
    type: PRE_VOTING_CONTAINER.REFRESH_SUCCESS,
    result,
  };
}

export function refreshFailure(error) {
  return {
    type: PRE_VOTING_CONTAINER.REFRESH_FAILURE,
    error,
  };
}

export function signRequest({ payload, privateKey }) {
  return {
    type: PRE_VOTING_CONTAINER.SIGN_REQUEST,
    payload,
    privateKey,
  };
}

export function signSuccess(result) {
  return {
    type: PRE_VOTING_CONTAINER.SIGN_SUCCESS,
    result,
  };
}

export function signFailure(error) {
  return {
    type: PRE_VOTING_CONTAINER.SIGN_FAILURE,
    error,
  };
}
