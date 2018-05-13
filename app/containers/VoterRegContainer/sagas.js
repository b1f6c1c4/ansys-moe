import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { reset, stopSubmit } from 'redux-form';
import { generateKeyPair } from 'utils/crypto';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as VOTER_REG_CONTAINER from './constants';
import * as voterRegContainerSelectors from './selectors';
import * as voterRegContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleRegisterRequest({ bId, iCode, comment }) {
  const { q, g } = yield select(voterRegContainerSelectors.Ballot());

  try {
    const { publicKey, privateKey } = yield call(generateKeyPair, undefined, { q, g });
    const vars = {
      bId,
      iCode,
      comment,
      publicKey,
    };
    const result = yield call(api.mutate, gql.Register, vars);
    yield put(voterRegContainerActions.registerSuccess(result, { privateKey }));
  } catch (err) {
    yield put(voterRegContainerActions.registerFailure(err));
    yield put(stopSubmit('voterRegForm', { _error: err }));
  }
}

export function* handleRefreshRequest({ bId }) {
  yield put(reset('voterRegForm'));
  try {
    const result = yield call(api.query, gql.Refresh, { bId });
    yield put(voterRegContainerActions.refreshSuccess(result));
    yield put(voterRegContainerActions.statusRequest());
  } catch (err) {
    yield put(voterRegContainerActions.refreshFailure(err));
  }
}

// Subscriptions
export function* handleStatusRequest() {
  const ballot = yield select((state) => state.getIn(['voterRegContainer', 'ballot']));
  if (!ballot) return;
  const { bId, owner } = ballot.toJS();
  yield put(subscriptionContainerActions.statusRequest({ bId, owner }));
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VOTER_REG_CONTAINER.REGISTER_REQUEST, handleRegisterRequest);
  yield takeEvery(VOTER_REG_CONTAINER.REFRESH_REQUEST, handleRefreshRequest);

  yield takeEvery(VOTER_REG_CONTAINER.STATUS_REQUEST_ACTION, handleStatusRequest);
}
