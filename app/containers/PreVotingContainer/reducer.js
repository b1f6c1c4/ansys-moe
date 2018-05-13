import _ from 'lodash';
import { fromJS } from 'immutable';
import shortid from 'shortid';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as PRE_VOTING_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  isSignLoading: false,
  ballot: null,
  fields: null,
  error: null,
  ticket: null,
  progress: null,
});

export const normalizeFields = (fs) => fs.map((f) => {
  // eslint-disable-next-line no-underscore-dangle
  const { __typename: type, prompt } = f;
  const common = { type, prompt, key: shortid.generate() };
  switch (type) {
    case 'StringField':
      return {
        ...common,
        default: f.default,
      };
    case 'EnumField':
      return {
        ...common,
        items: f.items,
      };
    default: {
      const e = new Error('Type not supported');
      e.codes = ['tpns'];
      throw e;
    }
  }
});

function preVotingContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION:
      if (state.getIn(['ballot', 'bId']) === action.bId) {
        return state.setIn(['ballot', 'status'], action.status);
      }
      return state;
    case PRE_VOTING_CONTAINER.SIGN_PROGRESS_ACTION:
      return state.set('progress', action.progress);
    // Sagas
    case PRE_VOTING_CONTAINER.REFRESH_REQUEST:
      return state.set('isLoading', true)
        .set('progress', null)
        .set('error', null)
        .set('ticket', null);
    case PRE_VOTING_CONTAINER.REFRESH_SUCCESS: {
      try {
        const fields = normalizeFields(action.result.ballot.fields);
        return state
          .set('isLoading', false)
          .set('ballot', fromJS(_.omit(action.result.ballot, 'fields')))
          .set('fields', fromJS(fields));
      } catch (e) {
        return state
          .set('isLoading', false)
          .set('error', fromJS(_.toPlainObject(e)));
      }
    }
    case PRE_VOTING_CONTAINER.REFRESH_FAILURE:
      return state.set('isLoading', false)
        .set('ballot', null)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case PRE_VOTING_CONTAINER.SIGN_REQUEST:
      return state.set('isSignLoading', true)
        .set('progress', 0);
    case PRE_VOTING_CONTAINER.SIGN_SUCCESS:
      return state.set('isSignLoading', false)
        .set('progress', null)
        .set('ticket', fromJS(action.result));
    case PRE_VOTING_CONTAINER.SIGN_FAILURE:
      return state.set('isSignLoading', false);
    // Default
    default:
      return state;
  }
}

export default preVotingContainerReducer;
