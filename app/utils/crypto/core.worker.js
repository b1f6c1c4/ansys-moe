import _ from 'lodash';
import * as core from './core';

const progress = (v) => postMessage({
  progress: v,
});

const process = async ({ method, param }) => {
  const func = core[method];
  return func(progress, ...param);
};

/* eslint-disable no-restricted-globals */
onmessage = ({ data }) => {
  process(data)
    .then((result) => {
      postMessage({ result });
      close();
    })
    .catch((error) => {
      postMessage({
        error: _.assign(_.toPlainObject(error), { message: error.message }),
      });
      close();
    });
};
/* eslint-enable no-restricted-globals */
