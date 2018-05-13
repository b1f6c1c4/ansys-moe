import _ from 'lodash';
import { fromJS } from 'immutable';

import * as EDIT_FIELDS_CONTAINER from 'containers/EditFieldsContainer/constants';
import * as EDIT_VOTERS_CONTAINER from 'containers/EditVotersContainer/constants';
import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as VIEW_BALLOT_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  ballot: null,
  error: null,
  count: null,
});

function viewBallotContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION:
      if (state.getIn(['ballot', 'bId']) === action.bId) {
        return state.setIn(['ballot', 'status'], action.status);
      }
      return state;
    case SUBSCRIPTION_CONTAINER.VOTER_REGISTERED_ACTION: {
      if (action.bId !== state.getIn(['ballot', 'bId'])) return state;
      const list = state.getIn(['ballot', 'voters']);
      if (!list) return state;
      const id = list.findIndex((b) => b.get('iCode') === action.voter.iCode);
      if (id === -1) return state;
      const newList = list
        .setIn([id, 'comment'], action.voter.comment)
        .setIn([id, 'publicKey'], action.voter.publicKey);
      return state.setIn(['ballot', 'voters'], newList);
    }
    // Sagas
    case VIEW_BALLOT_CONTAINER.BALLOT_REQUEST:
      return state.set('isLoading', true)
        .set('error', null);
    case VIEW_BALLOT_CONTAINER.BALLOT_SUCCESS:
      return state.set('isLoading', false)
        .set('ballot', fromJS(action.result.ballot))
        .set('count', action.result.countTickets);
    case VIEW_BALLOT_CONTAINER.BALLOT_FAILURE:
      return state.set('isLoading', false)
        .set('ballot', null)
        .set('count', null)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case VIEW_BALLOT_CONTAINER.FINALIZE_REQUEST:
      return state.set('isLoading', true);
    case VIEW_BALLOT_CONTAINER.FINALIZE_SUCCESS:
      return state.set('isLoading', false);
    case VIEW_BALLOT_CONTAINER.FINALIZE_FAILURE:
      return state.set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case VIEW_BALLOT_CONTAINER.EXPORT_REQUEST:
      return state;
    case VIEW_BALLOT_CONTAINER.EXPORT_SUCCESS:
      return state;
    case VIEW_BALLOT_CONTAINER.EXPORT_FAILURE:
      return state
        .set('error', fromJS(_.toPlainObject(action.error)));
    case EDIT_VOTERS_CONTAINER.CREATE_VOTER_SUCCESS:
      return state.set('ballot', null);
    case EDIT_VOTERS_CONTAINER.DELETE_VOTER_SUCCESS:
      return state.set('ballot', null);
    case EDIT_FIELDS_CONTAINER.SAVE_SUCCESS:
      return state.set('ballot', null);
    // Default
    default:
      return state;
  }
}

export default viewBallotContainerReducer;
