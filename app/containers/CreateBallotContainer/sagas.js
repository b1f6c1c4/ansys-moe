import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import {
  destroy,
  stopSubmit,
} from 'redux-form';
import { push } from 'react-router-redux';

import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as CREATE_BALLOT_CONTAINER from './constants';
import * as createBallotContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleCreateBallotRequest({ name }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.mutate, gql.CreateBallot, { name }, cred);
    const { bId } = result.createBallot;
    yield put(createBallotContainerActions.createBallotSuccess(result));
    yield put(globalContainerActions.ballotsRequest());
    yield put(destroy('createBallotForm'));
    yield put(push(`/app/ballots/${bId}`));
  } catch (err) {
    yield put(createBallotContainerActions.createBallotFailure(err));
    yield put(stopSubmit('createBallotForm', { _error: err }));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(CREATE_BALLOT_CONTAINER.CREATE_BALLOT_REQUEST, handleCreateBallotRequest);
}
