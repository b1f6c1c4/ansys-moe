import { delay } from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as HOME_CONTAINER from './constants';
import * as homeContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleStatusRequest() {
  try {
    const result = yield call(api.query, gql.Status);
    yield put(homeContainerActions.statusSuccess(result));
  } catch (err) {
    yield put(homeContainerActions.statusFailure(err));
  }
}

export function* handleStartRequest() {
  try {
    yield call(api.mutate, gql.Start);
    yield delay(1000);
    yield put(homeContainerActions.statusRequest());
  } catch (err) {
    yield put(homeContainerActions.startFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(HOME_CONTAINER.STATUS_REQUEST, handleStatusRequest);
  yield takeEvery(HOME_CONTAINER.START_REQUEST, handleStartRequest);
}
