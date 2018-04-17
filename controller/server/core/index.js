// const _ = require('lodash');
const etcd = require('../etcd');
const amqp = require('../amqp');
const { dedent } = require('./util');
const parse = require('../parser');
const logger = require('../logger')('core');

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r, { action }) => {
    logger.info(`Initializing ${r.proj}`, action);
    await etcd.put(r.mer('/config')).json(action).exec();
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
  }, async (r, payload) => {
    if (await r.decr({ '/initing': 1 })) {
      const rst = parse(payload);
      if (!rst) {
        logger.error('Init failed', payload);
        await r.incr({ '/failure': 1 });
        return;
      }
      logger.info('Init succeed', rst);
      await r.incr({ '/success': 1 });
    }
  });
};
