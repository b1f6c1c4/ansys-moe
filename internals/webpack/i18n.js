const _ = require('lodash');

module.exports = (res) => _.mapValues(
  res,
  (lst) => _.chain({})
    .assign(res.en)
    .assign(lst)
    .value(),
);
