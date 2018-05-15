import _ from 'lodash';
import { fromJS } from 'immutable';

import * as UPLOAD_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  files: null,
  uploaded: {},
  error: null,
});

function uploadContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    // Sagas
    case UPLOAD_CONTAINER.UPLOAD_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case UPLOAD_CONTAINER.UPLOAD_SUCCESS:
      return state.set('isLoading', false)
        .set('uploaded', state.get('uploaded').withMutations((ups) =>
          action.result.reduce((up, { old, new: newName }) =>
            up.set(newName, old), ups)));
    case UPLOAD_CONTAINER.UPLOAD_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case UPLOAD_CONTAINER.LIST_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case UPLOAD_CONTAINER.LIST_SUCCESS:
      return state.set('isLoading', false)
        .set('files', fromJS(action.result));
    case UPLOAD_CONTAINER.LIST_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default uploadContainerReducer;
