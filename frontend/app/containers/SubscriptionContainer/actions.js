import * as SUBSCRIPTION_CONTAINER from './constants';

// Actions
export function etcdChange(kvs) {
  return {
    type: SUBSCRIPTION_CONTAINER.ETCD_CHANGE_ACTION,
    kvs,
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
