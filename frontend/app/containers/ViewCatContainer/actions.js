import * as VIEW_CAT_CONTAINER from './constants';

// Actions

// Sagas
export function stopRequest({ proj, cHash }) {
  return {
    type: VIEW_CAT_CONTAINER.STOP_REQUEST,
    proj,
    cHash,
  };
}

export function stopSuccess(result) {
  return {
    type: VIEW_CAT_CONTAINER.STOP_SUCCESS,
    result,
  };
}

export function stopFailure(error) {
  return {
    type: VIEW_CAT_CONTAINER.STOP_FAILURE,
    error,
  };
}
