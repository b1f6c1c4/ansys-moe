import * as CHANGE_PASSWORD_CONTAINER from './constants';

// Actions

// Sagas
export function passwordRequest({ oldPassword, newPassword }) {
  return {
    type: CHANGE_PASSWORD_CONTAINER.PASSWORD_REQUEST,
    oldPassword,
    newPassword,
  };
}

export function passwordSuccess(result) {
  return {
    type: CHANGE_PASSWORD_CONTAINER.PASSWORD_SUCCESS,
    result,
  };
}

export function passwordFailure(error) {
  return {
    type: CHANGE_PASSWORD_CONTAINER.PASSWORD_FAILURE,
    error,
  };
}
