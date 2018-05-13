import * as SUBSCRIPTION_CONTAINER from './constants';

// Actions
export function etcdChange({ key, value }) {
  return {
    type: SUBSCRIPTION_CONTAINER.ETCD_CHANGE_ACTION,
    key,
    value,
  };
}

export function etcdRequest() {
  return {
    type: SUBSCRIPTION_CONTAINER.ETCD_REQUEST_ACTION,
  };
}

export function etcdStop() {
  return {
    type: SUBSCRIPTION_CONTAINER.ETCD_STOP_ACTION,
  };
}

// Sagas
