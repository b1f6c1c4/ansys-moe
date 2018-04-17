// const etcd = require('../etcd');
const amqp = require('../amqp');
// const { newId } = require('./util');
const logger = require('../logger')('core');

const mer = (r, p) => r.replace(/\/state$/, p || '');

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r) => {
    logger.info('Initializing', mer(r));
    // const config = await etcd.get(mer(r, '/config')).json();
    const id = `${mer(r)}:inited`;
    const script = `
    seq(0, 10, by=2)
    `;
    amqp.publish('rlang', { script }, id);
    r.incr({ '/initing': 1 });
  });

  petri.register({
    name: 'inited',
    external: true,
  }, async (r, { action }) => {
    logger.info('Inited', action);
    r.incr({ '/failed': 1 });
  });
};
