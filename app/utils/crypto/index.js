const makeMakeExport = () => {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line global-require
    const core = require('./core');
    return (k) => core[k];
  }

  // eslint-disable-next-line global-require
  const Worker = require('./core.worker');

  return (k) => (pg, ...param) => new Promise((resolve, reject) => {
    const worker = new Worker();
    worker.onmessage = ({ data: { result, error, progress } }) => {
      if (progress !== undefined) {
        pg(progress);
      } else if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };
    worker.postMessage({
      method: k,
      param,
    });
  });
};

const makeExport = makeMakeExport();

['generateKeyPair', 'signMessage'].forEach((k) => {
  module.exports[k] = makeExport(k);
});
