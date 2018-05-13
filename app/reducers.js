import { combineReducers } from 'redux-immutable';
import { fromJS } from 'immutable';
import { LOCATION_CHANGE } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form/immutable';

import * as GLOBAL_CONTAINER from 'containers/GlobalContainer/constants';
import languageProviderReducer from 'containers/LanguageProvider/reducer';
import changePasswordContainerReducer from 'containers/ChangePasswordContainer/reducer';
import createBallotContainerReducer from 'containers/CreateBallotContainer/reducer';
import editFieldsContainerReducer from 'containers/EditFieldsContainer/reducer';
import editVotersContainerReducer from 'containers/EditVotersContainer/reducer';
import globalContainerReducer from 'containers/GlobalContainer/reducer';
import loginContainerReducer from 'containers/LoginContainer/reducer';
import preVotingContainerReducer from 'containers/PreVotingContainer/reducer';
import snackbarContainerReducer from 'containers/SnackbarContainer/reducer';
import viewBallotContainerReducer from 'containers/ViewBallotContainer/reducer';
import viewStatContainerReducer from 'containers/ViewStatContainer/reducer';
import voterRegContainerReducer from 'containers/VoterRegContainer/reducer';

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
    language: languageProviderReducer,
    changePasswordContainer: changePasswordContainerReducer,
    createBallotContainer: createBallotContainerReducer,
    editFieldsContainer: editFieldsContainerReducer,
    editVotersContainer: editVotersContainerReducer,
    globalContainer: globalContainerReducer,
    loginContainer: loginContainerReducer,
    preVotingContainer: preVotingContainerReducer,
    snackbarContainer: snackbarContainerReducer,
    viewBallotContainer: viewBallotContainerReducer,
    viewStatContainer: viewStatContainerReducer,
    voterRegContainer: voterRegContainerReducer,
  });

  return (state, action) => {
    switch (action.type) {
      /* istanbul ignore next */
      case GLOBAL_CONTAINER.LOGOUT_ACTION:
        return appReducer(undefined, action);
      default:
        return appReducer(state, action);
    }
  };
}
