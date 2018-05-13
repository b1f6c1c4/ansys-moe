import _ from 'lodash';
import { fromJS } from 'immutable';
import shortid from 'shortid';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as EDIT_FIELDS_CONTAINER from './constants';

const initialState = fromJS({
  isLoading: false,
  isPristine: true,
  isOpen: false,
  isCreate: false,
  ballot: null,
  fields: null,
  error: null,
  currentId: null,
});

export const normalizeFields = (fs) => fs.map((f) => {
  // eslint-disable-next-line no-underscore-dangle
  const { __typename: type, prompt } = f;
  const common = { type, prompt, key: shortid.generate() };
  switch (type) {
    case 'StringField':
      return {
        ...common,
        stringDefault: f.default,
      };
    case 'EnumField':
      return {
        ...common,
        enumItems: f.items,
      };
    default: {
      const e = new Error('Type not supported');
      e.codes = ['tpns'];
      throw e;
    }
  }
});

function editFieldsContainerReducer(state = initialState, action) {
  switch (action.type) {
    // Actions
    case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION:
      if (state.getIn(['ballot', 'bId']) === action.bId) {
        return state.setIn(['ballot', 'status'], action.status);
      }
      return state;
    case EDIT_FIELDS_CONTAINER.REMOVE_ACTION:
      return state
        .set('isPristine', false)
        .set('fields', state.get('fields').delete(action.index));
    case EDIT_FIELDS_CONTAINER.REORDER_ACTION: {
      if (action.from === action.to) {
        return state;
      }
      const field = state.getIn(['fields', action.from]);
      const fields = state.get('fields')
        .delete(action.from).insert(action.to, field);
      return state
        .set('isPristine', false)
        .set('fields', fields);
    }
    case EDIT_FIELDS_CONTAINER.START_EDIT_ACTION:
      return state
        .set('isOpen', true)
        .set('isCreate', false)
        .set('currentId', action.index);
    case EDIT_FIELDS_CONTAINER.START_CREATE_ACTION:
      return state
        .set('isOpen', true)
        .set('isCreate', true);
    case EDIT_FIELDS_CONTAINER.CANCEL_DIALOG_ACTION:
      return state
        .set('isOpen', false)
        .set('currentId', null);
    case EDIT_FIELDS_CONTAINER.SUBMIT_DIALOG_ACTION: {
      if (!state.get('isCreate')) {
        const id = state.get('currentId');
        const key = state.getIn(['fields', id, 'key']);
        const field = fromJS(action.field).set('key', key);
        return state
          .set('isOpen', false)
          .set('isPristine', false)
          .set('currentId', null)
          .set('fields', state.get('fields').set(id, field));
      }
      const field = fromJS(action.field).set('key', shortid.generate());
      return state
        .set('isOpen', false)
        .set('isCreate', false)
        .set('isPristine', false)
        .set('fields', state.get('fields').push(field));
    }
    // Sagas
    case EDIT_FIELDS_CONTAINER.SAVE_REQUEST:
      return state
        .set('isLoading', true)
        .set('error', null);
    case EDIT_FIELDS_CONTAINER.SAVE_SUCCESS: {
      try {
        const fields = normalizeFields(action.result.replaceFields);
        return state
          .set('isLoading', false)
          .set('isPristine', true)
          .set('fields', fromJS(fields));
      } catch (e) {
        return state
          .set('isLoading', false)
          .set('error', fromJS(_.toPlainObject(e)));
      }
    }
    case EDIT_FIELDS_CONTAINER.SAVE_FAILURE:
      return state
        .set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    case EDIT_FIELDS_CONTAINER.REFRESH_REQUEST:
      return state
        .set('isLoading', true)
        .set('error', null);
    case EDIT_FIELDS_CONTAINER.REFRESH_SUCCESS: {
      try {
        const fields = normalizeFields(action.result.ballot.fields);
        return state
          .set('isLoading', false)
          .set('isPristine', true)
          .set('ballot', fromJS(_.omit(action.result.ballot, 'fields')))
          .set('fields', fromJS(fields));
      } catch (e) {
        return state
          .set('isLoading', false)
          .set('error', fromJS(_.toPlainObject(e)));
      }
    }
    case EDIT_FIELDS_CONTAINER.REFRESH_FAILURE:
      return state
        .set('isLoading', false)
        .set('error', fromJS(_.toPlainObject(action.error)));
    // Default
    default:
      return state;
  }
}

export default editFieldsContainerReducer;
