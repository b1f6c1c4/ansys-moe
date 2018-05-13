import { combineReducers } from 'redux-immutable';
import { fromJS } from 'immutable';
import { LOCATION_CHANGE } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form/immutable';

import globalContainerReducer from 'containers/GlobalContainer/reducer';
import viewProjContainerReducer from 'containers/ViewProjContainer/reducer';
import viewCatContainerReducer from 'containers/ViewCatContainer/reducer';

const routeInitialState = fromJS({
  location: null,
});

function routeReducer(state = routeInitialState, action) {
  switch (action.type) {
    /* istanbul ignore next */
    case LOCATION_CHANGE:
      return state.set('location', fromJS(action.payload));
    default:
      return state;
  }
}

export default function createReducer() {
  const appReducer = combineReducers({
    form: formReducer,
    route: routeReducer,
    globalContainer: globalContainerReducer,
    viewProjContainer: viewProjContainerReducer,
    viewCatContainer: viewCatContainerReducer,
  });

  return appReducer;
}
