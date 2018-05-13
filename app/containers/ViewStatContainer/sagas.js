import _ from 'lodash';
import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import downloadCsv from 'download-csv';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as VIEW_STAT_CONTAINER from './constants';
import * as viewStatContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleBallotRequest({ bId }) {
  try {
    const result = yield call(api.query, gql.Ballot, { bId });
    yield put(viewStatContainerActions.ballotSuccess(result));
    const fields = _.get(result, 'ballot.fields');
    if (fields) {
      const max = result.ballot.fields.length;
      yield put(viewStatContainerActions.statsRequest({ bId, max }));
    }
    yield put(viewStatContainerActions.statusRequest());
  } catch (err) {
    yield put(viewStatContainerActions.ballotFailure(err));
  }
}

export function* handleStatsRequest({ bId, max }) {
  try {
    const results = yield all(_.range(max).map((index) =>
      call(api.query, gql.FieldStat, { bId, index })));
    yield put(viewStatContainerActions.statsSuccess(results));
  } catch (err) {
    yield put(viewStatContainerActions.statsFailure(err));
  }
}

export function* handleExportRequest({ bId }) {
  try {
    const result = yield call(api.query, gql.Export, { bId });
    const fork = (nm, arr) => _.fromPairs(arr.map((v, k) => [`${nm}_${k}`, v]));
    const table = result.tickets.map(({
      t,
      payload: { bId: b, result: rst },
      s,
      c,
    }) => ({
      t,
      bId: b,
      ...fork('result', rst),
      ...fork('s', s),
      ...fork('c', c),
    }));
    yield call(downloadCsv, table, null, 'tickets.csv');
    yield put(viewStatContainerActions.exportSuccess(result));
  } catch (err) {
    yield put(viewStatContainerActions.exportFailure(err));
  }
}

// Subscriptions
export function* handleStatusRequest() {
  const ballot = yield select((state) => state.getIn(['viewStatContainer', 'ballot']));
  if (!ballot) return;
  const { bId, owner } = ballot.toJS();
  yield put(subscriptionContainerActions.statusRequest({ bId, owner }));
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_STAT_CONTAINER.BALLOT_REQUEST, handleBallotRequest);
  yield takeEvery(VIEW_STAT_CONTAINER.STATS_REQUEST, handleStatsRequest);
  yield takeEvery(VIEW_STAT_CONTAINER.EXPORT_REQUEST, handleExportRequest);

  yield takeEvery(VIEW_STAT_CONTAINER.STATUS_REQUEST_ACTION, handleStatusRequest);
}
