import _ from 'lodash';
import { delay, eventChannel } from 'redux-saga';
import {
  call,
  cancel as rawCancel,
  fork,
  put,
  race,
  take,
} from 'redux-saga/effects';
import * as api from 'utils/request';

import * as SUBSCRIPTION_CONTAINER from './constants';
import * as subscriptionContainerActions from './actions';
import gql from './api.graphql';

const close = (chan) => {
  if (_.isObject(chan)) {
    chan.close();
  }
};

const report = (err) => {
  /* eslint-disable no-console */
  if (_.isArray(err)) {
    err.forEach((e) => console.error(e));
  } else {
    console.error(err);
  }
  /* eslint-enable no-console */
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
      emit({ error: err });
    },
  });
  return () => obs1.unsubscribe();
});

export function* handleEtcdRequestAction() {
  const obs0 = yield call(api.subscribe, gql.Etcd);
  const chan = yield call(makeChan, 'watchEtcd', obs0);
  try {
    while (true) {
      const { error, result } = yield take(chan);
      if (error) throw error;
      yield put(subscriptionContainerActions.etcdChange(result));
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
  if (ob.isRunning()) return true;
  Ob[obN] = undefined;
  return false;
};

function* scheduleCancel(obN) {
  const ob = Ob[obN];
  yield delay(800);
  yield rawCancel(ob);
}

const uncancel = (obN) => {
  const ob = Ob[`${obN}Cancel`];
  if (!ob) return undefined;
  // eslint-disable-next-line redux-saga/yield-effects
  return rawCancel(ob);
};

const doCancel = (obN, force) => {
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
  return doCancel(obN, force);
};

export function* watchEtcd() {
  while (true) {
    const { request, stop } = yield race({
      request: take(SUBSCRIPTION_CONTAINER.ETCD_REQUEST_ACTION),
      stop: take(SUBSCRIPTION_CONTAINER.ETCD_STOP_ACTION),
    });
    if (request) {
      if (!valid('etcd')) {
        yield cancel('etcd');
        Ob.etcd = yield fork(handleEtcdRequestAction, request);
      }
      yield uncancel('etcd');
      continue;
    }
    if (stop) {
      Ob.etcdCancel = yield cancel('etcd', false);
      continue;
    }
  }
}

/* eslint-disable func-names */
export default function* watcher() {
  yield fork(watchEtcd);
}
