import * as LOGIN_CONTAINER from './constants';

// Actions
export function changeActiveId(value) {
  return {
    type: LOGIN_CONTAINER.CHANGE_ACTIVE_ID_ACTION,
    value,
  };
}

// Sagas
export function loginRequest({ username, password }) {
  return {
    type: LOGIN_CONTAINER.LOGIN_REQUEST,
    username,
    password,
  };
}

export function loginSuccess(result) {
  return {
    type: LOGIN_CONTAINER.LOGIN_SUCCESS,
    result,
  };
}

export function loginFailure(error) {
  return {
    type: LOGIN_CONTAINER.LOGIN_FAILURE,
    error,
  };
}

export function registerRequest({ username, password }) {
  return {
    type: LOGIN_CONTAINER.REGISTER_REQUEST,
    username,
    password,
  };
}

export function registerSuccess(result) {
  return {
    type: LOGIN_CONTAINER.REGISTER_SUCCESS,
    result,
  };
}

export function registerFailure(error) {
  return {
    type: LOGIN_CONTAINER.REGISTER_FAILURE,
    error,
  };
}
