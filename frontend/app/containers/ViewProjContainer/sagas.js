import _ from 'lodash';
import { delay } from 'redux-saga';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { push } from 'react-router-redux';

import * as globalContainerSelectors from 'containers/GlobalContainer/selectors';
import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as runContainerActions from 'containers/RunContainer/actions';
import * as VIEW_PROJ_CONTAINER from './constants';
import * as viewProjContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleStopRequest({ proj }) {
  try {
    const result = yield call(api.mutate, gql.Stop, { proj });
    yield delay(1000);
    yield put(globalContainerActions.etcdRequest());
    yield put(viewProjContainerActions.stopSuccess(result));
  } catch (err) {
    yield put(viewProjContainerActions.stopFailure(err));
  }
}

export function* handleDropRequest({ proj }) {
  try {
    const result = yield call(api.mutate, gql.Drop, { proj });
    yield delay(100);
    yield put(globalContainerActions.etcdRequest());
    yield put(push('/app/'));
    yield put(viewProjContainerActions.dropSuccess(result));
  } catch (err) {
    yield put(viewProjContainerActions.dropFailure(err));
  }
}

export function* handleEditAction({ proj }) {
  const listProj = yield select(globalContainerSelectors.ListProj());
  const config = _.get(listProj, [proj, 'config']);
  yield put(runContainerActions.upload(proj, config));
  yield put(push('/app/run'));
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_PROJ_CONTAINER.STOP_REQUEST, handleStopRequest);
  yield takeEvery(VIEW_PROJ_CONTAINER.DROP_REQUEST, handleDropRequest);
  yield takeEvery(VIEW_PROJ_CONTAINER.EDIT_ACTION, handleEditAction);
}
