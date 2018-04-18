const _ = require('lodash');
const etcd = require('../etcd');
const amqp = require('../amqp');
const { dedent } = require('./util');
const parse = require('../parser');
const logger = require('../logger')('core');

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r, { action }, proj) => {
    logger.info(`Initializing ${proj}`, action);
    const cfg = action;
    await etcd.put(`/${proj}/config`).json(cfg).exec();
    const id = `${proj}.inited`;
    const script = _.template(dedent`
      <% _.forEach(D, (d) => { %>
        <%= d.name %> <- seq(<%= d.lowerBound %>, <%= d.upperBound %>, length.out=<%= d.step %>)
      <% }); %>
      rst <- expand.grid(
        <% _.forEach(D, (d) => { %>
          <%= d.name %>=<%= d.name %>
        <% }); %>
      )
      library(jsonlite)
      toJSON(rst)
    `)(cfg);
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
