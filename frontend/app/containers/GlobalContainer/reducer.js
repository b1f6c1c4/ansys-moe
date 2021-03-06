import _ from 'lodash';
import { Map, fromJS } from 'immutable';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as GLOBAL_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  isDrawerOpen: false,
  error: null,
  etcd: {},
});

function globalContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case GLOBAL_CONTAINER.OPEN_DRAWER_ACTION:
      return state.set('isDrawerOpen', true);
    case GLOBAL_CONTAINER.CLOSE_DRAWER_ACTION:
      return state.set('isDrawerOpen', false);
    case SUBSCRIPTION_CONTAINER.ETCD_CHANGE_ACTION:
      return state.set('etcd', state.get('etcd').withMutations((etcd) => action.kvs.reduce((e, { key, value }) => {
        if (value === null) {
          return e.delete(key);
        }
        return e.set(key, value);
      }, etcd)));
    // Sagas
    case GLOBAL_CONTAINER.ETCD_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case GLOBAL_CONTAINER.ETCD_SUCCESS:
      return state.set('isLoading', false)
        .set('etcd', Map(_.map(action.result.etcd, ({ key, value }) => [key, value])));
    case GLOBAL_CONTAINER.ETCD_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default globalContainerReducer;
