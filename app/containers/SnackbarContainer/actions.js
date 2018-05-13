import * as SNACKBAR_CONTAINER from './constants';

// Actions
export function snackbarRequest(message) {
  return {
    type: SNACKBAR_CONTAINER.SNACKBAR_REQUEST_ACTION,
    message,
  };
}

export function snackbarShow(message) {
  return {
    type: SNACKBAR_CONTAINER.SNACKBAR_SHOW_ACTION,
    message,
  };
}

export function snackbarHide() {
  return {
    type: SNACKBAR_CONTAINER.SNACKBAR_HIDE_ACTION,
  };
}

// Sagas
