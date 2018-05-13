import _ from 'lodash';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import downloadCsv from 'download-csv';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as VIEW_BALLOT_CONTAINER from './constants';
import * as viewBallotContainerSelectors from './selectors';
import * as viewBallotContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleBallotRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.Ballot, { bId }, cred);
    yield put(viewBallotContainerActions.ballotSuccess(result));
    yield put(viewBallotContainerActions.statusRequest());
    yield put(viewBallotContainerActions.voterRgRequest());
  } catch (err) {
    yield put(viewBallotContainerActions.ballotFailure(err));
  }
}

export function* handleFinalizeRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));
  const ballot = yield select(viewBallotContainerSelectors.Ballot());
  const { status } = ballot;

  let mutation;
  switch (status) {
    case 'inviting':
      mutation = gql.FinalizeVoters;
      break;
    case 'invited':
      mutation = gql.FinalizeFields;
      break;
    case 'preVoting':
      mutation = gql.FinalizePreVoting;
      break;
    case 'voting':
      mutation = gql.FinalizeVoting;
      break;
    default:
      yield put(viewBallotContainerActions.finalizeFailure({ codes: ['stna'] }));
      break;
  }

  try {
    const result = yield call(api.mutate, mutation, { bId }, cred);
    yield put(viewBallotContainerActions.finalizeSuccess(result));
    yield put(viewBallotContainerActions.ballotRequest({ bId }));
  } catch (err) {
    yield put(viewBallotContainerActions.finalizeFailure(err));
  }
}

export function* handleExportRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.BallotCrypto, { bId }, cred);
    const table = [_.omit(result.ballot, '__typename')];
    yield call(downloadCsv, table, null, 'crypto.csv');
    yield put(viewBallotContainerActions.exportSuccess(result));
  } catch (err) {
    yield put(viewBallotContainerActions.exportFailure(err));
  }
}

// Subscriptions
export function* handleStatusRequest() {
  const ballot = yield select((state) => state.getIn(['viewBallotContainer', 'ballot']));
  if (!ballot) return;
  const { bId, owner } = ballot.toJS();
  yield put(subscriptionContainerActions.statusRequest({ bId, owner }));
}

export function* handleVoterRgRequest() {
  const ballot = yield select((state) => state.getIn(['viewBallotContainer', 'ballot']));
  if (!ballot) return;
  const { bId, status } = ballot.toJS();

  if (status === 'inviting') {
    yield put(subscriptionContainerActions.voterRgRequest({ bId }));
  }
}

export function* handleStatusChange({ bId, status }) {
  const ballot = yield select((state) => state.getIn(['viewBallotContainer', 'ballot']));
  if (ballot && ballot.get('bId') === bId) {
    if (status === 'inviting') {
      yield put(viewBallotContainerActions.voterRgRequest());
    } else {
      yield put(subscriptionContainerActions.voterRgStop());
    }
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_BALLOT_CONTAINER.BALLOT_REQUEST, handleBallotRequest);
  yield takeEvery(VIEW_BALLOT_CONTAINER.FINALIZE_REQUEST, handleFinalizeRequest);
  yield takeEvery(VIEW_BALLOT_CONTAINER.EXPORT_REQUEST, handleExportRequest);

  yield takeEvery(VIEW_BALLOT_CONTAINER.STATUS_REQUEST_ACTION, handleStatusRequest);
  yield takeEvery(VIEW_BALLOT_CONTAINER.VOTER_RG_REQUEST_ACTION, handleVoterRgRequest);
  yield takeEvery(SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION, handleStatusChange);
}
