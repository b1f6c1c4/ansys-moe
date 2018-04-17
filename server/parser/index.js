const rlang = require('./rlang');
const logger = require('../logger')('parser');

module.exports = ({ kind, action }) => {
  switch (kind) {
    case 'rlang':
      return rlang(action);
    default:
      logger.error('Kind not supported', kind);
      return null;
  }
};
