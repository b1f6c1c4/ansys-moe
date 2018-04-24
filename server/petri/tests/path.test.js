const { match, build } = require('../path');

describe('error', () => {
  const p = 'haha';

  it('should error', () => {
    expect(() => match(p, '/a/b')).toThrow();
    expect(() => build(p, { a: 'x' })).toThrow();
  });
});

describe('simple', () => {
  const p = '/a/b/c';

  it('should match', () => {
    expect(match(p, '/a/b')).toBeUndefined();
    expect(match(p, '/a/b/d')).toBeUndefined();
    expect(match(p, '/x/a/b/c')).toBeUndefined();
    expect(match(p, '/a/b/c')).toEqual({
      path: '/a/b/c',
      rest: '',
    });
    expect(match(p, '/a/b/c/d')).toEqual({
      path: '/a/b/c',
      rest: '/d',
    });
  });

  it('should build', () => {
    expect(build(p)).toEqual('/a/b/c');
    expect(build(p, { a: 'x' })).toEqual('/a/b/c');
  });
});

describe('prefixed', () => {
  const p = '../../a/b/c';

  it('should match', () => {
    expect(match(p, '/a/b/c')).toBeUndefined();
    expect(match(p, '../a/b/c')).toBeUndefined();
    expect(match(p, '../../a/b/c')).toEqual({
      path: '../../a/b/c',
      rest: '',
    });
    expect(match(p, '../../a/b/c/d')).toEqual({
      path: '../../a/b/c',
      rest: '/d',
    });
  });

  it('should build', () => {
    expect(build(p)).toEqual('../../a/b/c');
    expect(build(p, { a: 'x' })).toEqual('../../a/b/c');
  });
});

describe('any', () => {
  const p = '/a/:b/c';

  it('should match', () => {
    expect(match(p, '/a/b')).toBeUndefined();
    expect(match(p, '/a/b/d')).toBeUndefined();
    expect(match(p, '/x/a/b/c')).toBeUndefined();
    expect(match(p, '/a/#/c')).toBeUndefined();
    expect(match(p, '/a/x/c')).toEqual({
      path: '/a/x/c',
      rest: '',
      b: 'x',
    });
    expect(match(p, '/a/y/c/d')).toEqual({
      path: '/a/y/c',
      rest: '/d',
      b: 'y',
    });
  });

  it('should build', () => {
    expect(build(p)).toEqual('/a//c');
    expect(build(p, { b: 'x' })).toEqual('/a/x/c');
  });
});

describe('regex', () => {
  const p = '/a/:b=x|(y)/c';

  it('should match', () => {
    expect(match(p, '/a/b')).toBeUndefined();
    expect(match(p, '/a/b/c')).toBeUndefined();
    expect(match(p, '/a/bx/c')).toBeUndefined();
    expect(match(p, '/a/x/c')).toEqual({
      path: '/a/x/c',
      rest: '',
      b: 'x',
      details: {
        b: 'x'.match(/^x|(y)/),
      },
    });
    expect(match(p, '/a/y/c/d')).toEqual({
      path: '/a/y/c',
      rest: '/d',
      b: 'y',
      details: {
        b: 'y'.match(/^x|(y)/),
      },
    });
  });

  it('should build', () => {
    expect(build(p)).toEqual('/a//c');
    expect(build(p, { b: 'z' })).toEqual('/a/z/c');
  });
});
