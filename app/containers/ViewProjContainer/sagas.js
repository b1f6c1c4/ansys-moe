import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as VIEW_PROJ_CONTAINER from './constants';
import * as viewProjContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleStopRequest({ proj }) {
  try {
    const result = yield call(api.mutate, gql.Stop, { proj });
    yield put(viewProjContainerActions.stopSuccess(result));
  } catch (err) {
    yield put(viewProjContainerActions.stopFailure(err));
  }
}

export function* handleDropRequest({ proj }) {
  try {
    const result = yield call(api.mutate, gql.Drop, { proj });
    yield put(viewProjContainerActions.dropSuccess(result));
  } catch (err) {
    yield put(viewProjContainerActions.dropFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_PROJ_CONTAINER.STOP_REQUEST, handleStopRequest);
  yield takeEvery(VIEW_PROJ_CONTAINER.DROP_REQUEST, handleDropRequest);
}
