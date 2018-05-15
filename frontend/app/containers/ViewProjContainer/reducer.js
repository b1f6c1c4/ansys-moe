import _ from 'lodash';
import { fromJS } from 'immutable';

import * as GLOBAL_CONTAINER from 'containers/GlobalContainer/constants';
import * as VIEW_PROJ_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  error: null,
});

function viewProjContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case GLOBAL_CONTAINER.ETCD_REQUEST:
      return state.set('error', null);
    // Sagas
    case VIEW_PROJ_CONTAINER.STOP_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case VIEW_PROJ_CONTAINER.STOP_SUCCESS:
      return state.set('isLoading', false);
    case VIEW_PROJ_CONTAINER.STOP_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case VIEW_PROJ_CONTAINER.DROP_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case VIEW_PROJ_CONTAINER.DROP_SUCCESS:
      return state.set('isLoading', false);
    case VIEW_PROJ_CONTAINER.DROP_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default viewProjContainerReducer;
