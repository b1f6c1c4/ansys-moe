import { delay } from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { push } from 'react-router-redux';

import * as runContainerActions from 'containers/RunContainer/actions';
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

export function* handleCreateAction() {
  yield put(runContainerActions.upload('', {}));
  yield put(push('/app/run'));
}

export function* handlePurgeRequest() {
  try {
    const result = yield call(api.mutate, gql.Purge);
    yield put(homeContainerActions.purgeSuccess(result));
    yield delay(1000);
    yield put(homeContainerActions.statusRequest());
  } catch (err) {
    yield put(homeContainerActions.purgeFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(HOME_CONTAINER.STATUS_REQUEST, handleStatusRequest);
  yield takeEvery(HOME_CONTAINER.START_REQUEST, handleStartRequest);
  yield takeEvery(HOME_CONTAINER.PURGE_REQUEST, handlePurgeRequest);
  yield takeEvery(HOME_CONTAINER.CREATE_ACTION, handleCreateAction);
}
