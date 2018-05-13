import * as EDIT_FIELDS_CONTAINER from './constants';

// Actions
export function remove({ index }) {
  return {
    type: EDIT_FIELDS_CONTAINER.REMOVE_ACTION,
    index,
  };
}

export function reorder({ from, to }) {
  return {
    type: EDIT_FIELDS_CONTAINER.REORDER_ACTION,
    from,
    to,
  };
}

export function startEdit({ index }) {
  return {
    type: EDIT_FIELDS_CONTAINER.START_EDIT_ACTION,
    index,
  };
}

export function startCreate() {
  return {
    type: EDIT_FIELDS_CONTAINER.START_CREATE_ACTION,
  };
}

export function cancelDialog() {
  return {
    type: EDIT_FIELDS_CONTAINER.CANCEL_DIALOG_ACTION,
  };
}

export function submitDialog({ field }) {
  return {
    type: EDIT_FIELDS_CONTAINER.SUBMIT_DIALOG_ACTION,
    field,
  };
}

export function statusRequest() {
  return {
    type: EDIT_FIELDS_CONTAINER.STATUS_REQUEST_ACTION,
  };
}

// Sagas
export function saveRequest({ bId }) {
  return {
    type: EDIT_FIELDS_CONTAINER.SAVE_REQUEST,
    bId,
  };
}

export function saveSuccess(result) {
  return {
    type: EDIT_FIELDS_CONTAINER.SAVE_SUCCESS,
    result,
  };
}

export function saveFailure(error) {
  return {
    type: EDIT_FIELDS_CONTAINER.SAVE_FAILURE,
    error,
  };
}

export function refreshRequest({ bId }) {
  return {
    type: EDIT_FIELDS_CONTAINER.REFRESH_REQUEST,
    bId,
  };
}

export function refreshSuccess(result) {
  return {
    type: EDIT_FIELDS_CONTAINER.REFRESH_SUCCESS,
    result,
  };
}

export function refreshFailure(error) {
  return {
    type: EDIT_FIELDS_CONTAINER.REFRESH_FAILURE,
    error,
  };
}
