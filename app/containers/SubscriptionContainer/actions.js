import * as SUBSCRIPTION_CONTAINER from './constants';

// Actions
export function statusChange({ bId, status }) {
  return {
    type: SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION,
    bId,
    status,
  };
}

export function statusRequest({ bId, owner }) {
  return {
    type: SUBSCRIPTION_CONTAINER.STATUS_REQUEST_ACTION,
    bId,
    owner,
  };
}

export function statusStop() {
  return {
    type: SUBSCRIPTION_CONTAINER.STATUS_STOP_ACTION,
  };
}

export function statusesRequest() {
  return {
    type: SUBSCRIPTION_CONTAINER.STATUSES_REQUEST_ACTION,
  };
}

export function statusesStop() {
  return {
    type: SUBSCRIPTION_CONTAINER.STATUSES_STOP_ACTION,
  };
}

export function voterRgRequest({ bId }) {
  return {
    type: SUBSCRIPTION_CONTAINER.VOTER_RG_REQUEST_ACTION,
    bId,
  };
}

export function voterRgStop() {
  return {
    type: SUBSCRIPTION_CONTAINER.VOTER_RG_STOP_ACTION,
  };
}

export function voterRegistered(bId, voter) {
  return {
    type: SUBSCRIPTION_CONTAINER.VOTER_REGISTERED_ACTION,
    bId,
    voter,
  };
}

// Sagas
