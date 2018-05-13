import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as VIEW_EVAL_CONTAINER from './constants';
import * as viewEvalContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleStopRequest({ proj }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.Stop, { proj }, cred);
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
