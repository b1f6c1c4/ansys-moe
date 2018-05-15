import { delay } from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as VIEW_EVAL_CONTAINER from './constants';
import * as viewEvalContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleStopRequest({ proj, cHash, dHash }) {
  try {
    const result = yield call(api.mutate, gql.Stop, { proj, cHash, dHash });
    yield delay(1000);
    yield put(globalContainerActions.etcdRequest());
    yield put(viewEvalContainerActions.stopSuccess(result));
  } catch (err) {
    yield put(viewEvalContainerActions.stopFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_EVAL_CONTAINER.STOP_REQUEST, handleStopRequest);
}
