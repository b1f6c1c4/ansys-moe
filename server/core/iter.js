const _ = require('lodash');
const { run, parse } = require('../integration');
const logger = require('../logger')('core/iter');

module.exports = (petri) => {
  petri.register({
    name: 'i-req',
    root: '/cat/:cHash',
  }, async (r) => {
    if (await r.decr({ '/iter/req': 1 })) {
      // TODO
    }
  });

  petri.register({
    name: 'i-done',
    external: true,
    root: '/cat/:cHash',
  }, async (r) => {
    // TODO
  });
};
