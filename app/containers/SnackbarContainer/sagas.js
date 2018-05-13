import _ from 'lodash';
import { delay as rawDelay } from 'redux-saga';
import {
  call,
  cancel as rawCancel,
  fork,
  put,
  select,
  take,
  takeEvery,
} from 'redux-saga/effects';

import * as CHANGE_PASSWORD_CONTAINER from 'containers/ChangePasswordContainer/constants';
import * as CREATE_BALLOT_CONTAINER from 'containers/CreateBallotContainer/constants';
import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as SNACKBAR_CONTAINER from './constants';
import * as snackbarContainerActions from './actions';

const delay = (time) => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    return undefined;
  }
  /* istanbul ignore next */
  // eslint-disable-next-line redux-saga/yield-effects
  return rawDelay(time);
};

export function* handleSnackbarRequest({ message }, delayed = false) {
  if (delayed) {
    yield delay(100);
  }
  yield put(snackbarContainerActions.snackbarShow(message));
  yield delay(6000);
  yield put(snackbarContainerActions.snackbarHide());
}

export function* handleSimpleForward(action) {
  yield put(snackbarContainerActions.snackbarRequest(action));
}

export function* handleStatusChange(action) {
  let name;
  const list = yield select((state) => state.getIn(['globalContainer', 'listBallots']));
  if (list) {
    const id = list.findIndex((b) => b.get('bId') === action.bId);
    if (id !== -1) {
      name = list.getIn([id, 'name']);
    }
  }
  yield put(snackbarContainerActions.snackbarRequest({ ...action, name }));
}

export function* resolveVoterName1(pars) {
  const bId = yield select((state) => state.getIn(['viewBallotContainer', 'ballot', 'bId']));
  if (bId !== pars.bId) return undefined;
  const ballot = yield select((state) => state.getIn(['viewBallotContainer', 'ballot', 'name']));
  const list = yield select((state) => state.getIn(['viewBallotContainer', 'ballot', 'voters']));
  const id = list.findIndex((b) => b.get('iCode') === pars.voter.iCode);
  if (id === -1) return undefined;
  return {
    ballot,
    name: list.getIn([id, 'name']),
  };
}

export function* resolveVoterName2(pars) {
  const bId = yield select((state) => state.getIn(['editVotersContainer', 'ballot', 'bId']));
  if (bId !== pars.bId) return undefined;
  const ballot = yield select((state) => state.getIn(['editVotersContainer', 'ballot', 'name']));
  const list = yield select((state) => state.getIn(['editVotersContainer', 'voters']));
  const id = list.findIndex((b) => b.get('iCode') === pars.voter.iCode);
  if (id === -1) return undefined;
  return {
    ballot,
    name: list.getIn([id, 'name']),
  };
}

export function* handleVoterRegistered(action) {
  let obj = yield call(resolveVoterName1, action);
  if (!obj) {
    obj = yield call(resolveVoterName2, action);
  }
  yield put(snackbarContainerActions.snackbarRequest({ ...action, ...obj }));
}

// Sagas

// Watcher
const cancel = (ob) => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    _.set(ob, 'isRunning', () => false);
    return undefined;
  }
  /* istanbul ignore next */
  // eslint-disable-next-line redux-saga/yield-effects
  return rawCancel(ob);
};

const valid = (ob) => {
  if (!ob) return false;
  /* istanbul ignore else */
  if (ob.isRunning()) return true;
  /* istanbul ignore next */
  return false;
};

export function* watchSnackbar() {
  let ob;
  while (true) {
    const request = yield take(SNACKBAR_CONTAINER.SNACKBAR_REQUEST_ACTION);
    if (valid(ob)) {
      yield put(snackbarContainerActions.snackbarHide());
      yield cancel(ob);
      ob = yield fork(handleSnackbarRequest, request, true);
    } else {
      ob = yield fork(handleSnackbarRequest, request);
    }
  }
}

/* eslint-disable func-names */
export default function* watcher() {
  yield fork(watchSnackbar);

  yield takeEvery(SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION, handleStatusChange);
  yield takeEvery(SUBSCRIPTION_CONTAINER.VOTER_REGISTERED_ACTION, handleVoterRegistered);
  yield takeEvery(CHANGE_PASSWORD_CONTAINER.PASSWORD_SUCCESS, handleSimpleForward);
  yield takeEvery(CREATE_BALLOT_CONTAINER.CREATE_BALLOT_SUCCESS, handleSimpleForward);
}
