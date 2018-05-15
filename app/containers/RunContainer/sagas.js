import { delay } from 'redux-saga';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import * as api from 'utils/request';

import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as RUN_CONTAINER from './constants';
import * as runContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleRunRequest() {
  const form = yield select((state) => state.getIn(['runContainer', 'form']));

  try {
    const name = form.get('name');
    const config = form.get('config').toJS();
    const result = yield call(api.mutate, gql.Run, {
      name,
      config,
    });
    yield delay(1000);
    yield put(globalContainerActions.etcdRequest());
    yield delay(200);
    yield put(push(`/app/p/${name}`));
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
