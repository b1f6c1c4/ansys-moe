import * as VIEW_EVAL_CONTAINER from './constants';

// Actions

// Sagas
export function stopRequest({ proj }) {
  return {
    type: VIEW_EVAL_CONTAINER.STOP_REQUEST,
    proj,
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
