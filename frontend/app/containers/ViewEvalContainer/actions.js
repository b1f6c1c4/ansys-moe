import * as VIEW_EVAL_CONTAINER from './constants';

// Actions

// Sagas
export function stopRequest({ proj, cHash, dHash }) {
  return {
    type: VIEW_EVAL_CONTAINER.STOP_REQUEST,
    proj,
    cHash,
    dHash,
  };
}

export function stopSuccess(result) {
  return {
    type: VIEW_EVAL_CONTAINER.STOP_SUCCESS,
    result,
  };
}

export function stopFailure(error) {
  return {
    type: VIEW_EVAL_CONTAINER.STOP_FAILURE,
    error,
  };
}
