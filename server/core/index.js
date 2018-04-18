const _ = require('lodash');
const etcd = require('../etcd');
const amqp = require('../amqp');
const { newId, dedent } = require('./util');
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
  }, async (r, payload, proj) => {
    if (await r.decr({ '/initing': 1 })) {
      const rst = parse(payload);
      if (!rst) {
        logger.error('Init failed', payload);
        await r.incr({ '/failure': 1 });
        return;
      }
      logger.info('Init succeed', rst);
      await r.dyn('/scan');
      for (const dpars of rst[0]) {
        const id = newId();
        await etcd.put(`/${proj}/params/scan/${id}`).json(dpars).exec();
        await r.incr({ [`/scan/${id}/init`]: 1 });
      }
    }
  });

  petri.register({
    name: 'scan/init',
    root: /^\/scan\/([a-z0-9]+)/,
  }, async (r) => {
    if (await r.decr('/init')) {
      // TODO
      await r.incr({ '/calcG': 1 });
    }
  });
};
