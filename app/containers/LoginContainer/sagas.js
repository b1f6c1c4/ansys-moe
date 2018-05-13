import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import {
  change,
  reset,
  destroy,
  stopSubmit,
} from 'redux-form';
import { push } from 'react-router-redux';
import jwtDecode from 'jwt-decode';

import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as LOGIN_CONTAINER from './constants';
import * as loginContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleLoginRequest({ username, password }) {
  try {
    const result = yield call(api.mutate, gql.Login, { username, password });
    if (!result.login) {
      const e = new Error('Credential not accepted');
      e.codes = ['wgup'];
      throw e;
    }
    const decoded = jwtDecode(result.login);
    decoded.token = result.login;
    yield put(globalContainerActions.login(decoded));
    yield put(loginContainerActions.loginSuccess(result));
    yield put(destroy('loginForm'));
    yield put(push('/app/'));
  } catch (err) {
    yield put(loginContainerActions.loginFailure(err));
    yield put(stopSubmit('loginForm', { _error: err }));
  }
}

export function* handleRegisterRequest({ username, password }) {
  try {
    const result = yield call(api.mutate, gql.Register, { username, password });
    yield put(loginContainerActions.registerSuccess(result));
    yield put(destroy('registerForm'));
    yield put(loginContainerActions.changeActiveId(0));
    yield put(reset('loginForm'));
    yield put(change('loginForm', 'username', username));
  } catch (err) {
    yield put(loginContainerActions.registerFailure(err));
    yield put(stopSubmit('registerForm', { _error: err }));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(LOGIN_CONTAINER.LOGIN_REQUEST, handleLoginRequest);
  yield takeEvery(LOGIN_CONTAINER.REGISTER_REQUEST, handleRegisterRequest);
}
