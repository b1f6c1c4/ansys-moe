import * as UPLOAD_CONTAINER from './constants';

// Actions

// Sagas
export function uploadRequest(files) {
  return {
    type: UPLOAD_CONTAINER.UPLOAD_REQUEST,
    files,
  };
}

export function uploadSuccess(result) {
  return {
    type: UPLOAD_CONTAINER.UPLOAD_SUCCESS,
    result,
  };
}

export function uploadFailure(error) {
  return {
    type: UPLOAD_CONTAINER.UPLOAD_FAILURE,
    error,
  };
}

export function listRequest() {
  return {
    type: UPLOAD_CONTAINER.LIST_REQUEST,
  };
}

export function listSuccess(result) {
  return {
    type: UPLOAD_CONTAINER.LIST_SUCCESS,
    result,
  };
}

export function listFailure(error) {
  return {
    type: UPLOAD_CONTAINER.LIST_FAILURE,
    error,
  };
}

export function deleteRequest({ name }) {
  return {
    type: UPLOAD_CONTAINER.DELETE_REQUEST,
    name,
  };
}

export function deleteSuccess(result, name) {
  return {
    type: UPLOAD_CONTAINER.DELETE_SUCCESS,
    result,
    name,
  };
}

export function deleteFailure(error) {
  return {
    type: UPLOAD_CONTAINER.DELETE_FAILURE,
    error,
  };
}
