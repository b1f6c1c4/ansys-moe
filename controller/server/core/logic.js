const _ = require('lodash');
const etcd = require('../etcd');
const { hash, dedent } = require('../util');
const { run, parse } = require('../integration');
const ansys = require('./ansys');
const expression = require('../integration/expression');
const logger = require('../logger')('core/logic');

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r, payload, proj, cfg) => {
    logger.info(`Initializing ${proj}`);
    const script = _.template(dedent`
      <% _.forEach(D, (d) => { %>
        <%= d.name %> <- seq(<%= d.lowerBound %>, <%= d.upperBound %>, length.out=<%= d.step %>)
      <% }); %>
      rst <- expand.grid(
        <% _.forEach(D, (d) => { %>
          <%= d.name %>=<%= d.name %>
        <% }); %>
      )
      toJSON(rst)
    `)(cfg);
    run('rlang', script, {}, { proj, name: 'inited' });
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
        const id = hash(dpars);
        await etcd.put(`/${proj}/params/scan/${id}`).json(dpars).exec();
        await r.incr({ [`/scan/${id}/init`]: 1 });
      }
    }
  });

  petri.register({
    name: 'scan-init',
    root: /^\/scan\/([a-z0-9]+)/,
  }, async (r, payload, proj, cfg) => {
    if (await r.decr({ '/init': 1 })) {
      const variables = await etcd.get(`/${proj}/params/scan/${r.param[0]}`).json();
      await r.dyn('/G');
      for (const gpar of cfg.G) {
        const { name, kind, code } = gpar;
        run(kind, code, variables, {
          proj,
          name: 'scan-G-check',
          root: `${r.root}/G/${name}`,
        });
        await r.incr({ [`/G/${name}/run`]: 1 });
      }
    }
  });

  petri.register({
    name: 'scan-G-check',
    external: true,
    root: /^\/scan\/([a-z0-9]+)\/G\/([a-z0-9]+)/,
  }, async (r, payload, proj) => {
    if (await r.decr({ '/run': 1 })) {
      const rst = parse(payload);
      if (!rst) {
        logger.warn('G failed', payload);
        await r.incr({ '/failure': 1 });
        return;
      }
      logger.debug('G succeed', rst);
      await etcd.put(`/${proj}/params/scan/${r.param[0]}/G/${r.param[1]}`).value(rst[0]).exec();
      await r.incr({ '../@': 1 });
    }
  });

  petri.register({
    name: 'scan-G-done',
    root: /^\/scan\/([a-z0-9]+)/,
  }, async (r, payload, proj, cfg) => {
    if (await r.done('/G')) {
      const variables = await etcd.get(`/${proj}/params/scan/${r.param[0]}`).json();
      for (const gpar of cfg.G) {
        const { name, lowerBound, upperBound } = gpar;
        const val = await etcd.get(`/${proj}/params/scan/${r.param[0]}/G/${name}`).number();
        if ((lowerBound && lowerBound > val) || (upperBound && upperBound < val)) {
          logger.warn(`G ${name} out of bound`, r.param);
          await r.incr({ '../@': 1 });
          return;
        }
        _.set(variables, name, val);
      }
      logger.info('G pars done', variables);
      await etcd.put(`/${proj}/params/scan/${r.param[0]}`).json(variables).exec();
      const ruleId = _.findIndex(cfg.ansys.rules, ({ condition }) =>
        !condition || expression.run(condition, variables) > 0);
      const rule = cfg.ansys.rules[ruleId];
      await etcd.put(`/${proj}/params/scan/${r.param[0]}/M`).value(ruleId).exec();
      const vars = _.pick(variables, _.map(rule.inputs, 'variable'));
      // const id = hash({
      //   proj,
      //   filename: rule.filename,
      //   vars,
      // });
      ansys.mutate(rule, vars, {
        proj,
        name: 'scan-M-solve',
        root: r.root,
      });
      await r.incr({ '/M/mutate': 1 });
    }
  });

  petri.register({
    name: 'scan-M-solve',
    external: true,
    root: /^\/scan\/([a-z0-9]+)/,
  }, async (r, payload, proj, cfg) => {
    if (await r.decr({ '/M/mutate': 1 })) {
      // const variables = await etcd.get(`/${proj}/params/scan/${r.param[0]}`).json();
      const ruleId = await etcd.get(`/${proj}/params/scan/${r.param[0]}/M`).number();
      const rule = cfg.ansys.rules[ruleId];
      // TODO: parse ansys
      const file = `${proj}.scan-M-solve${r.root.replace(/\//g, '.')}/${rule.filename}`;
      logger.info('M mutate done', file);
      ansys.solve(file, rule, {
        proj,
        name: 'scan-M-done',
        root: r.root,
      });
      await r.incr({ '/M/solve': 1 });
    }
  });

  petri.register({
    name: 'scan-M-done',
    external: true,
    root: /^\/scan\/([a-z0-9]+)/,
  }, async (r, payload, proj, cfg) => {
    if (await r.decr({ '/M/solve': 1 })) {
      // const variables = await etcd.get(`/${proj}/params/scan/${r.param[0]}`).json();
      const ruleId = await etcd.get(`/${proj}/params/scan/${r.param[0]}/M`).number();
      const rule = cfg.ansys.rules[ruleId];
      // TODO: parse ansys
      const file = `${proj}.scan-M-done${r.root.replace(/\//g, '.')}/${rule.filename}`;
      logger.info('M solve done', file);
      await r.incr({ '/success': 1 });
    }
  });
};
