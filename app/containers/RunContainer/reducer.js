import _ from 'lodash';
import { fromJS } from 'immutable';

import * as RUN_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  form: {},
  error: null,
});

function runContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case RUN_CONTAINER.UPLOAD_ACTION: {
      let s = state;
      if (action.name !== undefined) {
        s = s.setIn(['form', 'name'], fromJS(action.name));
      }
      if (action.config !== undefined) {
        s = s.setIn(['form', 'config'], fromJS(action.config));
      }
      return s;
    }
    // Sagas
    case RUN_CONTAINER.RUN_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case RUN_CONTAINER.RUN_SUCCESS:
      return state.set('isLoading', false);
    case RUN_CONTAINER.RUN_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default runContainerReducer;
