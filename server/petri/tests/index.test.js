const _ = require('lodash');
const { PetriNet } = require('../');

describe('PetriNet', () => {
  let db;
  const dbMock = {
    get: (key) => db[key],
    set: (key, value) => { db[key] = value; },
    setMultiple: (obj) => { _.assign(db, obj); },
  };

  beforeEach(() => {
    db = {};
  });

  it('should handle static', async (done) => {
    const petri = new PetriNet(dbMock, /^\/[a-z0-9]+/);

    petri.register({
      name: 'init',
      external: true,
    }, async (r, payload) => {
      expect(payload).toEqual('pld');
      await r.incr({ '/init': 1 });
    });

    petri.register('static fork', async (r) => {
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '/a': 1, '/b': 2 });
      }
    });

    petri.register('a', async (r) => {
      if (await r.decr({ '/b': 1 })) {
        await r.incr({ '/c': 1 });
      }
    });

    await petri.dispatch('/xx/state', 'init', 'pld');
    expect(db).toEqual({
      '/xx/state/init': 0,
      '/xx/state/a': 1,
      '/xx/state/b': 0,
      '/xx/state/c': 2,
    });
    done();
  });

  it('should handle dynamic fork', async (done) => {
    const petri = new PetriNet(dbMock, /^\/[a-z0-9]+/);

    petri.register({
      name: 'init',
      external: true,
    }, async (r, payload) => {
      expect(payload).toEqual('pld');
      await r.dyn('/f');
      await r.incr(_.mapKeys({ a: 1, b: 2 }, (v, k) => `/f/${k}/init`));
    });

    await petri.dispatch('/xx/state', 'init', 'pld');
    expect(db).toEqual({
      '/xx/state/f': 1,
      '/xx/state/f/#': 3,
      '/xx/state/f/a/init': 1,
      '/xx/state/f/b/init': 2,
    });
    done();
  });

  it('should handle root change', async (done) => {
    const petri = new PetriNet(dbMock, /^\/[a-z0-9]+/);

    petri.register({
      name: 'init',
      external: true,
    }, async (r, payload) => {
      expect(payload).toEqual('pld');
      await r.incr(_.mapKeys({ a: 1, b: 2 }, (v, k) => `/f/${k}/init`));
    });

    petri.register({
      name: 'f/init',
      root: /^\/f\/[a-z0-0]+/,
    }, async (r) => {
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '/st': 1 });
        await r.incr({ '../../x': 1 });
        await r.incr({ '../../../y': 1 });
      }
    });

    await petri.dispatch('/xx/state', 'init', 'pld');
    expect(db).toEqual({
      '/xx/state/f/a/init': 0,
      '/xx/state/f/a/st': 1,
      '/xx/state/f/b/init': 0,
      '/xx/state/f/b/st': 2,
      '/xx/state/x': 3,
      '/xx/y': 3,
    });
    done();
  });

  it('should handle dynamic merge', async (done) => {
    const petri = new PetriNet(dbMock, /^\/[a-z0-9]+/);

    petri.register({
      name: 'init',
      external: true,
    }, async (r, payload) => {
      expect(payload).toEqual('pld');
      await r.dyn('/f');
      await r.incr(_.mapKeys({ a: 1, b: 2 }, (k) => `/f/${k}/init`));
    });

    petri.register({
      name: 'f/gather',
      root: /^\/f\/[a-z0-0]+/,
    }, async (r) => {
      if (await r.decr({ '/inst': 1 })) {
        await r.incr({ '../@': 1 });
      }
    });

    petri.register('done', async (r) => {
      if (await r.done('/f')) {
        await r.incr({ '/done': 1 });
      }
    });

    await petri.dispatch('/xx/state', 'init', 'pld');
    expect(db).toEqual({
      '/xx/state/f': 0,
      '/xx/state/f/#': 0,
      '/xx/state/f/a/init': 0,
      '/xx/state/f/b/init': 0,
      '/xx/state/f/@': 0,
      '/xx/state/done': 1,
    });
    done();
  });
});
