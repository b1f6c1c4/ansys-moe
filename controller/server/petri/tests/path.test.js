/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
