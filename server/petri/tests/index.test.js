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

  it('should handle name not found', async (done) => {
    const petri = new PetriNet(dbMock);
    await petri.dispatch({
      name: 'init',
      base: '/xx/state',
    });
    expect(db).toEqual({});
    done();
  });

  it('should handle static', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'init',
      external: true,
    }, async (r, payload) => {
      expect(payload.k).toEqual('v');
      await r.incr({ '/init': 1 });
      return 'rv';
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

    const rv = await petri.dispatch({
      name: 'init',
      base: '/xx/state',
      root: '/f/a',
      k: 'v',
    });
    expect(rv).toEqual('rv');
    expect(db).toEqual({
      '/xx/state/init': 0,
      '/xx/state/a': 1,
      '/xx/state/b': 0,
      '/xx/state/c': 2,
    });
    done();
  });

  it('should handle dynamic fork', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'init',
      external: true,
    }, async (r) => {
      await r.dyn('/f');
      await r.incr(_.mapKeys({ a: 1, b: 2 }, (v, k) => `/f/${k}/init`));
    });

    await petri.dispatch({
      name: 'init',
      base: '/xx/state',
    });
    expect(db).toEqual({
      '/xx/state/f': 1,
      '/xx/state/f/#': 3,
      '/xx/state/f/a/init': 1,
      '/xx/state/f/b/init': 2,
    });
    done();
  });

  it('should handle root change', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'init',
      external: true,
    }, async (r) => {
      await r.incr(_.mapKeys({ a: 1, b: 2 }, (v, k) => `/f/${k}/init`));
    });

    petri.register({
      name: 'f/init',
      root: '/f/:fv',
    }, async (r) => {
      expect(['a', 'b']).toContain(r.param.fv);
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '/st': 1 });
        await r.incr({ '../../x': 1 });
        await r.incr({ '../../../y': 1 });
      }
    });

    await petri.dispatch({
      name: 'init',
      base: '/xx/state',
    });
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

  it('should handle root change dispatch', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'f/init',
      external: true,
      root: '/f/:fv',
    }, async (r) => {
      await r.incr({ '/init': 1 });
    });

    petri.register({
      name: 'f/st',
      root: '/f/:fv',
    }, async (r) => {
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '/st': 1 });
        await r.incr({ '../../x': 1 });
        await r.incr({ '../../../y': 1 });
      }
    });

    await petri.dispatch({
      name: 'f/init',
      base: '/xx/state',
      root: '/f/a',
    });
    expect(db).toEqual({
      '/xx/state/f/a/init': 0,
      '/xx/state/f/a/st': 1,
      '/xx/state/x': 1,
      '/xx/y': 1,
    });
    done();
  });

  it('should throw root not match', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'f/init',
      external: true,
      root: '/f/:fv',
    }, async (r) => {
      await r.incr({ '/init': 1 });
    });

    petri.register({
      name: 'f/st',
      root: '/f/:fv',
    }, async (r) => {
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '/st': 1 });
        await r.incr({ '../../x': 1 });
        await r.incr({ '../../../y': 1 });
      }
    });

    try {
      await petri.dispatch({
        name: 'f/init',
        base: '/xx/state',
        root: '/f',
      });
      expect(undefined).toBeDefined();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
    done();
  });

  it('should handle dynamic merge', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'init',
      external: true,
    }, async (r) => {
      await r.dyn('/f');
      await r.incr(_.mapKeys({ a: 1, b: 2 }, (v, k) => `/f/${k}/init`));
    });

    petri.register({
      name: 'f/gather',
      root: '/f/:fv',
    }, async (r) => {
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '../@': 1 });
      }
    });

    petri.register('done', async (r) => {
      if (await r.done('/f')) {
        await r.incr({ '/done': 1 });
      }
    });

    await petri.dispatch({
      name: 'init',
      base: '/xx/state',
    });
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
