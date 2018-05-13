import _ from 'lodash';
import { delay, eventChannel } from 'redux-saga';
import {
  call,
  cancel as rawCancel,
  fork,
  put,
  race,
  select,
  take,
} from 'redux-saga/effects';
import * as api from 'utils/request';

import * as SUBSCRIPTION_CONTAINER from './constants';
import * as subscriptionContainerActions from './actions';
import gql from './api.graphql';

const close = (chan) => {
  /* istanbul ignore if */
  if (_.isObject(chan)) {
    chan.close();
  }
};

const report = (err) => {
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'test') {
    /* eslint-disable no-console */
    if (_.isArray(err)) {
      err.forEach((e) => console.error(e));
    } else {
      console.error(err);
    }
    /* eslint-enable no-console */
  }
};

export const makeChan = (lbl, obs0) => eventChannel((emit) => {
  const obs1 = obs0.subscribe({
    next(data) {
      if (_.get(data, 'errors')) {
        emit({ error: data.errors });
        return;
      }
      const result = _.get(data, `data.${lbl}`);
      if (result) {
        emit({ result });
      }
    },
    error(err) {
      /* istanbul ignore next */
      emit({ error: err });
    },
  });
  return () => obs1.unsubscribe();
});

export function* handleStatusRequestAction({ bId }) {
  const obs0 = yield call(api.subscribe, gql.BallotStatus, { bId });
  const chan = yield call(makeChan, 'ballotStatus', obs0);
  try {
    while (true) {
      const { error, result } = yield take(chan);
      if (error) throw error;
      yield put(subscriptionContainerActions.statusChange(result));
    }
  } catch (err) {
    report(err);
  } finally {
    close(chan);
  }
}

export function* handleStatusesRequestAction() {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));
  if (!cred) return;

  const obs0 = yield call(api.subscribe, gql.BallotsStatus, undefined, cred);
  const chan = yield call(makeChan, 'ballotsStatus', obs0);
  try {
    while (true) {
      const { error, result } = yield take(chan);
      if (error) throw error;
      yield put(subscriptionContainerActions.statusChange(result));
    }
  } catch (err) {
    report(err);
  } finally {
    close(chan);
  }
}

export function* handleVoterRgRequestAction({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));
  if (!cred) return;

  const obs0 = yield call(api.subscribe, gql.VoterRegistered, { bId }, cred);
  const chan = yield call(makeChan, 'voterRegistered', obs0);
  try {
    while (true) {
      const { error, result } = yield take(chan);
      /* istanbul ignore if */
      if (error) throw error;
      yield put(subscriptionContainerActions.voterRegistered(bId, result));
    }
  } catch (err) {
    report(err);
  } finally {
    close(chan);
  }
}

// Sagas

// Watcher
const Ob = {};

const valid = (obN) => {
  const ob = Ob[obN];
  if (!ob) return false;
  /* istanbul ignore else */
  if (ob.isRunning()) return true;
  /* istanbul ignore next */
  Ob[obN] = undefined;
  /* istanbul ignore next */
  return false;
};

/* istanbul ignore next */
function* scheduleCancel(obN) {
  const ob = Ob[obN];
  yield delay(800);
  yield rawCancel(ob);
}

const uncancel = /* istanbul ignore next */ (obN) => {
  const ob = Ob[`${obN}Cancel`];
  if (!ob) return undefined;
  // eslint-disable-next-line redux-saga/yield-effects
  return rawCancel(ob);
};

const doCancel = /* istanbul ignore next */ (obN, force) => {
  if (!force) {
    const k = `${obN}Cancel`;
    if (Ob[k]) return undefined;
    // eslint-disable-next-line redux-saga/yield-effects
    return fork(scheduleCancel, obN);
  }
  const ob = Ob[obN];
  Ob[obN] = undefined;
  // eslint-disable-next-line redux-saga/yield-effects
  return rawCancel(ob);
};

const cancel = (obN, force = true) => {
  const ob = Ob[obN];
  if (!ob) return undefined;
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    ob.isRunning = () => false;
    return undefined;
  }
  /* istanbul ignore next */
  return doCancel(obN, force);
};

export const testReset = (ob) => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    _.keys(Ob).forEach((k) => _.set(Ob, k, undefined));
    _.assign(Ob, ob);
  }
};

export function* watchStatus() {
  let bId;
  while (true) {
    const { request, stop } = yield race({
      request: take(SUBSCRIPTION_CONTAINER.STATUS_REQUEST_ACTION),
      stop: take(SUBSCRIPTION_CONTAINER.STATUS_STOP_ACTION),
    });
    if (request) {
      if (!valid('Status') || request.bId !== bId) {
        const username = yield select((state) => state.getIn(['globalContainer', 'credential', 'username']));
        if (username !== request.owner || !valid('Statuses')) {
          yield cancel('Status');
          Ob.Status = yield fork(handleStatusRequestAction, request);
          ({ bId } = request);
        }
      }
      yield uncancel('Status');
      continue;
    }
    /* istanbul ignore else */
    if (stop) {
      Ob.StatusCancel = yield cancel('Status', false);
      continue;
    }
  }
}

export function* watchStatuses() {
  while (true) {
    const { request, stop } = yield race({
      request: take(SUBSCRIPTION_CONTAINER.STATUSES_REQUEST_ACTION),
      stop: take(SUBSCRIPTION_CONTAINER.STATUSES_STOP_ACTION),
    });
    if (request) {
      if (!valid('Statuses')) {
        Ob.Statuses = yield fork(handleStatusesRequestAction, request);
      }
      continue;
    }
    /* istanbul ignore else */
    if (stop) {
      yield cancel('Statuses');
      continue;
    }
  }
}

export function* watchVoterRg() {
  let bId;
  while (true) {
    const { request, stop } = yield race({
      request: take(SUBSCRIPTION_CONTAINER.VOTER_RG_REQUEST_ACTION),
      stop: take(SUBSCRIPTION_CONTAINER.VOTER_RG_STOP_ACTION),
    });
    if (request) {
      if (!valid('VoterRg') || request.bId !== bId) {
        yield cancel('VoterRg');
        Ob.VoterRg = yield fork(handleVoterRgRequestAction, request);
        ({ bId } = request);
      }
      yield uncancel('VoterRg');
      continue;
    }
    /* istanbul ignore else */
    if (stop) {
      Ob.VoterRgCancel = yield cancel('VoterRg', false);
      continue;
    }
  }
}

/* eslint-disable func-names */
export default function* watcher() {
  yield fork(watchStatus);
  yield fork(watchStatuses);
  yield fork(watchVoterRg);
}
