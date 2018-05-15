import { delay } from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as UPLOAD_CONTAINER from './constants';
import * as uploadContainerActions from './actions';

// Sagas
export function* handleUploadRequest({ files }) {
  try {
    const result = yield call(api.uploadStorage, files);
    yield put(uploadContainerActions.listRequest());
    yield delay(100);
    yield put(uploadContainerActions.uploadSuccess(result));
  } catch (err) {
    yield put(uploadContainerActions.uploadFailure(err));
  }
}

export function* handleListRequest() {
  try {
    const result = yield call(api.listStorage, 'upload');
    yield put(uploadContainerActions.listSuccess(result));
  } catch (err) {
    yield put(uploadContainerActions.listFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(UPLOAD_CONTAINER.UPLOAD_REQUEST, handleUploadRequest);
  yield takeEvery(UPLOAD_CONTAINER.LIST_REQUEST, handleListRequest);
}
