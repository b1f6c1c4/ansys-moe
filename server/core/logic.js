const _ = require('lodash');
const { hash, dedent } = require('../util');
const { run, parse } = require('../integration');
const ansys = require('./ansys');
const expression = require('../integration/expression');
const logger = require('../logger')('core/logic');

module.exports = (petri) => {
  petri.register({
    name: 'init',
    external: true,
  }, async (r) => {
    logger.info(`Initializing ${r.proj}`);
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
      await r.dyn('/scan');
      for (const dpars of rst[0]) {
        const id = hash(dpars);
        await r.store('/:proj/params/scan/:id', { id }, dpars);
        await r.incr({ '/scan/:id/init': 1 }, { id });
      }
    }
  });

  petri.register({
    name: 'scan-init',
    root: '/scan/:dHash',
  }, async (r) => {
    if (await r.decr({ '/init': 1 })) {
      const variables = await r.retrive('/:proj/params/scan/:dHash').json();
      await r.dyn('/G');
      for (const gpar of r.cfg.G) {
        const { name, kind, code } = gpar;
        run(kind, code, variables, {
          proj: r.proj,
          name: 'scan-G-check',
          root: `${r.root}/G/${name}`,
        });
        await r.incr({ '/G/:name/run': 1 }, { name });
      }
    }
  });

  petri.register({
    name: 'scan-G-check',
    external: true,
    root: '/scan/:dHash/G/:name',
  }, async (r, payload) => {
    if (await r.decr({ '/run': 1 })) {
      const rst = parse(payload);
      if (!rst) {
        logger.warn('G failed', payload);
        await r.incr({ '/failure': 1 });
        return;
      }
      logger.debug('G succeed', rst);
      await r.store('/:proj/params/scan/:dHash/G/:name', rst[0]);
      await r.incr({ '../@': 1 });
    }
  });

  petri.register({
    name: 'scan-G-done',
    root: '/scan/:dHash',
  }, async (r) => {
    if (await r.done('/G')) {
      const variables = await r.retrive('/:proj/params/scan/:dHash').json();
      for (const gpar of r.cfg.G) {
        const { name, lowerBound, upperBound } = gpar;
        const val = await r.retrive('/:proj/params/scan/:dHash/G/:name', { name }).number();
        if ((lowerBound && lowerBound > val) || (upperBound && upperBound < val)) {
          logger.warn(`G ${name} out of bound`, r.param);
          await r.incr({ '../@': 1 });
          return;
        }
        _.set(variables, name, val);
      }
      logger.info('G pars done', variables);
      await r.store('/:proj/params/scan/:dHash').json(variables).exec();
      const ruleId = _.findIndex(r.cfg.ansys.rules, ({ condition }) =>
        !condition || expression.run(condition, variables) > 0);
      const rule = r.cfg.ansys.rules[ruleId];
      await r.store('/:proj/params/scan/:dHash/M').value(ruleId).exec();
      const vars = _.pick(variables, _.map(rule.inputs, 'variable'));
      // const id = hash({
      //   proj: r.proj,
      //   filename: rule.filename,
      //   vars,
      // });
      ansys.mutate(rule, vars, {
        proj: r.proj,
        name: 'scan-M-solve',
        root: r.root,
      });
      await r.incr({ '/M/mutate': 1 });
    }
  });

  petri.register({
    name: 'scan-M-solve',
    external: true,
    root: '/scan/:dHash',
  }, async (r, payload) => {
    if (await r.decr({ '/M/mutate': 1 })) {
      // const variables = await r.retrive('/:proj/params/scan/:dHash').json();
      const ruleId = await r.retrive('/:proj/params/scan/:dHash/M').number();
      const rule = r.cfg.ansys.rules[ruleId];
      // TODO: parse ansys
      logger.warn('TODO: parse ansys', payload);
      const file = `:proj.scan-M-solve${r.root.replace(/\//g, '.')}/${rule.filename}`;
      logger.info('M mutate done', file);
      ansys.solve(file, rule, {
        proj: r.proj,
        name: 'scan-M-done',
        root: r.root,
      });
      await r.incr({ '/M/solve': 1 });
    }
  });

  petri.register({
    name: 'scan-M-done',
    external: true,
    root: '/scan/:dHash',
  }, async (r, payload) => {
    if (await r.decr({ '/M/solve': 1 })) {
      // const variables = await r.retrive('/:proj/params/scan/:dHash').json();
      const ruleId = await r.retrive('/:proj/params/scan/:dHash/M').number();
      const rule = r.cfg.ansys.rules[ruleId];
      // TODO: parse ansys
      logger.warn('TODO: parse ansys', payload);
      const file = `:proj.scan-M-done${r.root.replace(/\//g, '.')}/${rule.filename}`;
      logger.info('M solve done', file);
      await r.incr({ '/success': 1 });
    }
  });
};
