const _ = require('lodash');
const { PetriNet, makeProxy } = require('../');

describe('makeProxy', () => {
  it('should get', (done) => {
    const proxy = makeProxy({
      ensure: (p) => {
        expect(p).toEqual('/ga/ha');
        done();
      },
      root: 1,
      param: { v: 'ha' },
    });
    expect(proxy.root).toEqual(1);
    expect(proxy.param).toEqual({ v: 'ha' });
    expect(proxy.a).toBeUndefined();
    proxy.ensure('/:k/:v', { k: 'ga' });
  });
  it('should not set', () => {
    expect(() => { makeProxy({}).a = 1; }).toThrow();
  });
  it('should not defineProperty', () => {
    expect(() => { Object.defineProperty(makeProxy({}), 'a', {}); }).toThrow();
  });
  it('should not deleteProperty', () => {
    expect(() => { delete makeProxy({}).a; }).toThrow();
  });
  it('should not preventExtensions', () => {
    expect(() => { Object.preventExtensions(makeProxy({})); }).toThrow();
  });
  it('should not setPrototypeOf', () => {
    expect(() => { Object.setPrototypeOf(makeProxy({}), null); }).toThrow();
  });
});

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

  it('should retrieve', () => {
    const petri = new PetriNet(dbMock);
    petri.register({
      name: 'init',
      external: true,
      key: 'v1',
    });
    petri.register({
      name: 'init',
      external: false,
      key: 'v2',
    });
    expect(petri.retrieve('w')).toBeUndefined();
    expect(petri.retrieve('init').option.key).toEqual('v1');
    expect(petri.retrieve('init', false).option.key).toEqual('v2');
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
      expect(r.option.name).toEqual('init');
      expect(r.petri).toBe(petri);
      await r.incr({ '/init': 1 });
      return r.context.rv;
    });

    petri.register('static fork', async (r) => {
      if (await r.decr({ '/init': 1 })) {
        await r.incr({ '/a': 1, '/b': 2, '/xx': 2 });
      }
    });

    petri.register({
      name: 'x',
      pre: ['/a', '/xx'],
    }, async (r) => {
      await r.incr({ '/w': 2 });
    });

    petri.register({
      name: 'a',
      pre: '/b',
    }, async (r) => {
      await r.incr({ '/c': 1 });
    });

    const rv = await petri.dispatch({
      name: 'init',
      base: '/xx/state',
      root: '/f/a',
      k: 'v',
    }, { rv: 'rv' });
    expect(rv).toEqual('rv');
    expect(db).toEqual({
      '/xx/state/init': 0,
      '/xx/state/xx': 1,
      '/xx/state/a': 0,
      '/xx/state/b': 0,
      '/xx/state/c': 2,
      '/xx/state/w': 2,
    });
    done();
  });

  it('should handle assert', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'init',
      external: true,
      pre: {},
    }, async (r, payload) => {
      expect(payload.k).toEqual('v');
      await r.incr({ '/init': 1, '/evil': 1 });
    });

    petri.register({
      name: 'neg',
      pre: {
        lte: { '/evil': 0 },
        decr: { '/init': 1 },
      },
    }, async (r) => {
      await r.incr({ '/a': 1 });
    });

    petri.register({
      name: 'pos',
      pre: {
        gte: { '/evil': 1 },
        decr: { '/init': 1, '/evil': 1 },
      },
    }, async (r) => {
      await r.incr({ '/b': 1, '/init': 1 });
    });

    await petri.dispatch({
      name: 'init',
      base: '/xx/state',
      root: '/f/a',
      k: 'v',
    });
    expect(db).toEqual({
      '/xx/state/init': 0,
      '/xx/state/evil': 0,
      '/xx/state/a': 1,
      '/xx/state/b': 1,
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
      expect(['/f/a', '/f/b']).toContain(r.root);
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

  it('should handle dynamic merge simple', async (done) => {
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
      pre: '/init',
    }, async (r) => {
      await r.incr({ '../@': 1 });
    });

    petri.register({
      name: 'done',
      pre: { done: '/f' },
    }, async (r) => {
      await r.incr({ '/done': 1 });
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

  it('should handle dynamic merge', async (done) => {
    const petri = new PetriNet(dbMock);

    petri.register({
      name: 'init',
      external: true,
    }, async (r) => {
      await r.incr({ '/x': 1 });
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

    petri.register({
      name: 'done',
      pre: { decr: { '/x': 1 }, done: '/f' },
    }, async (r) => {
      await r.incr({ '/done': 1 });
    });

    await petri.dispatch({
      name: 'init',
      base: '/xx/state',
    });
    expect(db).toEqual({
      '/xx/state/f': 0,
      '/xx/state/x': 0,
      '/xx/state/f/#': 0,
      '/xx/state/f/a/init': 0,
      '/xx/state/f/b/init': 0,
      '/xx/state/f/@': 0,
      '/xx/state/done': 1,
    });
    done();
  });
});
