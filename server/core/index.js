const _ = require('lodash');
// const etcd = require('../etcd');
const amqp = require('../amqp');
const { dedent } = require('./util');
const rlang = require('./parser/rlang');
const logger = require('../logger')('core');

const proj = (r) => _.set(r, 'proj', r.base.match(/^\/([a-z0-9]+)/)[1]);
// const mer = (r, p) => `/${r.proj}${p}`;

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r) => {
    proj(r);
    logger.info('Initializing', r.proj);
    // const config = await etcd.get(mer(r, '/config')).json();
    const id = `${r.proj}.inited`;
    const script = dedent`
      rst <- seq(0, 10, by=2)
      library(jsonlite)
      toJSON(rst)
    `;
    amqp.publish('rlang', { script }, id);
    await r.incr({ '/initing': 1 });
  });

  petri.register({
    name: 'inited',
    external: true,
  }, async (r, { action }) => {
    if (await r.decr({ '/initing': 1 })) {
      const rst = rlang(action);
      if (!rst) {
        logger.error('Init failed', action);
        await r.incr({ '/failure': 1 });
        return;
      }
      logger.info('Init succeed', rst);
      await r.incr({ '/success': 1 });
    }
  });
};
