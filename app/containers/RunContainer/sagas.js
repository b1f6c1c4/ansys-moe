import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as RUN_CONTAINER from './constants';
import * as runContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleRunRequest() {
  try {
    const result = yield call(api.query, gql.Run, { name: 'TODO' });
    yield put(runContainerActions.runSuccess(result));
  } catch (err) {
    yield put(runContainerActions.runFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(RUN_CONTAINER.RUN_REQUEST, handleRunRequest);
}
