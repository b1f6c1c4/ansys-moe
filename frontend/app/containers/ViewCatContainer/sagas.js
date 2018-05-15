import { delay } from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as VIEW_CAT_CONTAINER from './constants';
import * as viewCatContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleStopRequest({ proj, cHash }) {
  try {
    const result = yield call(api.mutate, gql.Stop, { proj, cHash });
    yield delay(1000);
    yield put(globalContainerActions.etcdRequest());
    yield put(viewCatContainerActions.stopSuccess(result));
  } catch (err) {
    yield put(viewCatContainerActions.stopFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_CAT_CONTAINER.STOP_REQUEST, handleStopRequest);
}
