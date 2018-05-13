import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { reset } from 'redux-form';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as EDIT_VOTERS_CONTAINER from './constants';
import * as editVotersContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleCreateVoterRequest({ bId, name }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.mutate, gql.CreateVoter, { bId, name }, cred);
    yield put(editVotersContainerActions.createVoterSuccess(result));
    yield put(reset('createVoterForm'));
  } catch (err) {
    yield put(editVotersContainerActions.createVoterFailure(err));
  }
}

export function* handleDeleteVoterRequest({ bId, iCode }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.mutate, gql.DeleteVoter, { bId, iCode }, cred);
    yield put(editVotersContainerActions.deleteVoterSuccess(result, { iCode }));
  } catch (err) {
    yield put(editVotersContainerActions.deleteVoterFailure(err));
  }
}

export function* handleVotersRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.Voters, { bId }, cred);
    yield put(editVotersContainerActions.votersSuccess(result));
    yield put(editVotersContainerActions.statusRequest());
    yield put(editVotersContainerActions.voterRgRequest());
  } catch (err) {
    yield put(editVotersContainerActions.votersFailure(err));
  }
}

// Subscriptions
export function* handleStatusRequest() {
  const ballot = yield select((state) => state.getIn(['editVotersContainer', 'ballot']));
  if (!ballot) return;
  const { bId, owner } = ballot.toJS();
  yield put(subscriptionContainerActions.statusRequest({ bId, owner }));
}

export function* handleVoterRgRequest() {
  const ballot = yield select((state) => state.getIn(['editVotersContainer', 'ballot']));
  if (!ballot) return;
  const { bId, status } = ballot.toJS();

  if (status === 'inviting') {
    yield put(subscriptionContainerActions.voterRgRequest({ bId }));
  }
}

export function* handleStatusChange({ bId, status }) {
  const ballot = yield select((state) => state.getIn(['editVotersContainer', 'ballot']));
  if (ballot && ballot.get('bId') === bId) {
    if (status === 'inviting') {
      yield put(editVotersContainerActions.voterRgRequest());
    } else {
      yield put(subscriptionContainerActions.voterRgStop());
    }
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(EDIT_VOTERS_CONTAINER.CREATE_VOTER_REQUEST, handleCreateVoterRequest);
  yield takeEvery(EDIT_VOTERS_CONTAINER.VOTERS_REQUEST, handleVotersRequest);
  yield takeEvery(EDIT_VOTERS_CONTAINER.DELETE_VOTER_REQUEST, handleDeleteVoterRequest);

  yield takeEvery(EDIT_VOTERS_CONTAINER.STATUS_REQUEST_ACTION, handleStatusRequest);
  yield takeEvery(EDIT_VOTERS_CONTAINER.VOTER_RG_REQUEST_ACTION, handleVoterRgRequest);
  yield takeEvery(SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION, handleStatusChange);
}
