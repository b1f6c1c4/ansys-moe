import * as VIEW_PROJ_CONTAINER from './constants';

// Actions

// Sagas
export function stopRequest({ proj }) {
  return {
    type: VIEW_PROJ_CONTAINER.STOP_REQUEST,
    proj,
  };
}

export function stopSuccess(result) {
  return {
    type: VIEW_PROJ_CONTAINER.STOP_SUCCESS,
    result,
  };
}

export function stopFailure(error) {
  return {
    type: VIEW_PROJ_CONTAINER.STOP_FAILURE,
    error,
  };
}

export function dropRequest({ proj }) {
  return {
    type: VIEW_PROJ_CONTAINER.DROP_REQUEST,
    proj,
  };
}

export function dropSuccess(result) {
  return {
    type: VIEW_PROJ_CONTAINER.DROP_SUCCESS,
    result,
  };
}

export function dropFailure(error) {
  return {
    type: VIEW_PROJ_CONTAINER.DROP_FAILURE,
    error,
  };
}
