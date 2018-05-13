import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import {
  reset,
  stopSubmit,
} from 'redux-form';
import { push } from 'react-router-redux';

import * as CHANGE_PASSWORD_CONTAINER from './constants';
import * as changePasswordContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handlePasswordRequest({ oldPassword, newPassword }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.mutate, gql.Password, { oldPassword, newPassword }, cred);
    if (!result.password) {
      const e = new Error('Credential not accepted');
      e.codes = ['wgpp'];
      throw e;
    }
    yield put(changePasswordContainerActions.passwordSuccess(result));
    yield put(reset('passwordForm'));
    yield put(push('/app/'));
  } catch (err) {
    yield put(changePasswordContainerActions.passwordFailure(err));
    yield put(stopSubmit('passwordForm', { _error: err }));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(CHANGE_PASSWORD_CONTAINER.PASSWORD_REQUEST, handlePasswordRequest);
}
