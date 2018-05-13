import _ from 'lodash';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';
import { initialize } from 'redux-form';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as EDIT_FIELDS_CONTAINER from './constants';
import * as editFieldsContainerActions from './actions';
import gql from './api.graphql';

export function* updateDialogEdit({ index }) {
  const raw = yield select((state) => state.getIn(['editFieldsContainer', 'fields', index]));
  const {
    type,
    prompt,
    stringDefault,
    enumItems,
  } = raw.toJS();
  const values = { type, prompt };
  switch (type) {
    case 'StringField':
      values.stringDefault = stringDefault;
      break;
    case 'EnumField':
      values.enumItems = enumItems.join('\n');
      break;
    default:
      break;
  }

  yield put(initialize('editFieldForm', values, {
    updateUnregisteredFields: true,
  }));
}

export function* updateDialogCreate() {
  yield put(initialize('editFieldForm', {}, {
    updateUnregisteredFields: true,
  }));
}

// Sagas
export function* handleSaveRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));
  const rawFields = yield select((state) => state.getIn(['editFieldsContainer', 'fields']));
  const fields = rawFields.toJS().map((f) => _.omit(f, ['type', 'key']));

  try {
    const result = yield call(api.mutate, gql.Save, { bId, fields }, cred);
    yield put(editFieldsContainerActions.saveSuccess(result));
  } catch (err) {
    yield put(editFieldsContainerActions.saveFailure(err));
  }
}

export function* handleRefreshRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.Refresh, { bId }, cred);
    yield put(editFieldsContainerActions.refreshSuccess(result));
    yield put(editFieldsContainerActions.statusRequest());
  } catch (err) {
    yield put(editFieldsContainerActions.refreshFailure(err));
  }
}

// Subscriptions
export function* handleStatusRequest() {
  const ballot = yield select((state) => state.getIn(['editFieldsContainer', 'ballot']));
  if (!ballot) return;
  const { bId, owner } = ballot.toJS();
  yield put(subscriptionContainerActions.statusRequest({ bId, owner }));
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(EDIT_FIELDS_CONTAINER.START_EDIT_ACTION, updateDialogEdit);
  yield takeEvery(EDIT_FIELDS_CONTAINER.START_CREATE_ACTION, updateDialogCreate);
  yield takeEvery(EDIT_FIELDS_CONTAINER.SAVE_REQUEST, handleSaveRequest);
  yield takeEvery(EDIT_FIELDS_CONTAINER.REFRESH_REQUEST, handleRefreshRequest);

  yield takeEvery(EDIT_FIELDS_CONTAINER.STATUS_REQUEST_ACTION, handleStatusRequest);
}
