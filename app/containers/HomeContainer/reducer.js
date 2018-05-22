import _ from 'lodash';
import { fromJS } from 'immutable';

import * as HOME_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  controller: false,
  rabbit: null,
  error: null,
});

function homeContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case HOME_CONTAINER.CREATE_ACTION:
      return state;
    // Sagas
    case HOME_CONTAINER.STATUS_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case HOME_CONTAINER.STATUS_SUCCESS:
      return state.set('isLoading', false)
        .set('controller', action.result.controller)
        .set('rabbit', fromJS(_.omit(action.result.rabbit, '__typename')));
    case HOME_CONTAINER.STATUS_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case HOME_CONTAINER.START_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case HOME_CONTAINER.START_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case HOME_CONTAINER.PURGE_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case HOME_CONTAINER.PURGE_SUCCESS:
      return state.set('isLoading', false);
    case HOME_CONTAINER.PURGE_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default homeContainerReducer;
