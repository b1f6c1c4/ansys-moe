import _ from 'lodash';
import { eventChannel, END } from 'redux-saga';
import { call, put, select, take, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { change, reset, initialize, stopSubmit } from 'redux-form';
import { signMessage } from 'utils/crypto';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as PRE_VOTING_CONTAINER from './constants';
import * as preVotingContainerSelectors from './selectors';
import * as preVotingContainerActions from './actions';
import gql from './api.graphql';

export const makeChan = (fn, ...args) => eventChannel((emit) => {
  const progress = (v) => emit({ progress: v });
  fn(progress, ...args)
    .then((result) => {
      emit({ result });
      emit(END);
    })
    .catch((error) => {
      emit({ error });
      emit(END);
    });
  return () => {};
});

// Sagas
export function* handleRefreshRequest({ bId }) {
  yield put(reset('preVotingForm'));
  try {
    const result = yield call(api.query, gql.Refresh, { bId });
    yield put(preVotingContainerActions.refreshSuccess(result));
    yield put(preVotingContainerActions.statusRequest());
    const values = _.fromPairs(_.map(result.ballot.fields, (f, i) => {
      // eslint-disable-next-line no-underscore-dangle
      switch (f.__typename) {
        case 'StringField':
          return [String(i), f.default];
        case 'EnumField':
        default:
          return [String(i), undefined];
      }
    }));
    yield put(initialize('preVotingForm', values, {
      updateUnregisteredFields: true,
    }));
  } catch (err) {
    yield put(preVotingContainerActions.refreshFailure(err));
  }
}

export function* handleSignRequest({ payload, privateKey }) {
  const {
    q,
    g,
    h,
    voters,
  } = yield select(preVotingContainerSelectors.Ballot());
  const ys = _.map(voters, 'publicKey');

  try {
    const chan = yield call(makeChan, signMessage, payload, {
      q,
      g,
      h,
      x: privateKey,
      ys,
    });
    while (true) {
      const { progress, result, error } = yield take(chan);
      if (progress !== undefined) {
        yield put(preVotingContainerActions.signProgress(progress));
      }
      if (result) {
        yield put(preVotingContainerActions.signSuccess(result));
        yield change('preVotingForm', { privateKey: '' });
      }
      if (error) {
        yield put(preVotingContainerActions.signFailure(error));
        yield put(stopSubmit('preVotingForm', { _error: error }));
      }
    }
  } finally {
    // ignore
  }
}

// Subscriptions
export function* handleStatusRequest() {
  const ballot = yield select((state) => state.getIn(['preVotingContainer', 'ballot']));
  if (!ballot) return;
  const { bId, owner } = ballot.toJS();
  yield put(subscriptionContainerActions.statusRequest({ bId, owner }));
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(PRE_VOTING_CONTAINER.REFRESH_REQUEST, handleRefreshRequest);
  yield takeEvery(PRE_VOTING_CONTAINER.SIGN_REQUEST, handleSignRequest);

  yield takeEvery(PRE_VOTING_CONTAINER.STATUS_REQUEST_ACTION, handleStatusRequest);
}
