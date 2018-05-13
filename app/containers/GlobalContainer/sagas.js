import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { push } from 'react-router-redux';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as GLOBAL_CONTAINER from './constants';
import * as globalContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleBallotsRequest() {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.Ballots, undefined, cred);
    yield put(globalContainerActions.ballotsSuccess(result));
  } catch (err) {
    yield put(globalContainerActions.ballotsFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(GLOBAL_CONTAINER.BALLOTS_REQUEST, handleBallotsRequest);

  yield takeEvery(GLOBAL_CONTAINER.LOGIN_ACTION, function* () {
    yield put(globalContainerActions.ballotsRequest());
    yield put(subscriptionContainerActions.statusesRequest());
  });

  yield takeEvery(GLOBAL_CONTAINER.LOGOUT_ACTION, function* () {
    yield put(push('/app/login'));
    yield put(subscriptionContainerActions.statusesStop());
  });
}
