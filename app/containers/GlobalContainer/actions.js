import * as GLOBAL_CONTAINER from './constants';

// Actions
export function openDrawer() {
  return {
    type: GLOBAL_CONTAINER.OPEN_DRAWER_ACTION,
  };
}

export function closeDrawer() {
  return {
    type: GLOBAL_CONTAINER.CLOSE_DRAWER_ACTION,
  };
}

export function openAccount() {
  return {
    type: GLOBAL_CONTAINER.OPEN_ACCOUNT_ACTION,
  };
}

export function closeAccount() {
  return {
    type: GLOBAL_CONTAINER.CLOSE_ACCOUNT_ACTION,
  };
}

export function login(credential) {
  return {
    type: GLOBAL_CONTAINER.LOGIN_ACTION,
    credential,
  };
}

export function logout() {
  return {
    type: GLOBAL_CONTAINER.LOGOUT_ACTION,
  };
}

// Sagas
export function ballotsRequest() {
  return {
    type: GLOBAL_CONTAINER.BALLOTS_REQUEST,
  };
}

export function ballotsSuccess(result) {
  return {
    type: GLOBAL_CONTAINER.BALLOTS_SUCCESS,
    result,
  };
}

export function ballotsFailure(error) {
  return {
    type: GLOBAL_CONTAINER.BALLOTS_FAILURE,
    error,
  };
}
