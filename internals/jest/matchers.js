const _ = require('lodash');
const { isImmutable } = require('immutable');

/* eslint-disable import/no-extraneous-dependencies */
const diff = require('jest-diff');
const { equals } = require('expect/build/jasmine_utils');
const {
  matcherHint,
  printReceived,
  printExpected,
} = require('jest-matcher-utils');
/* eslint-enable import/no-extraneous-dependencies */

const purify = (o) => _.cloneDeepWith(o, (v) => {
  if (isImmutable(v)) {
    return purify(v.toJS());
  }
  if (_.isPlainObject(v)) {
    return _.chain(o)
      .omitBy(_.isUndefined)
      .mapValues(purify)
      .value();
  }
  // No recursion for unknown objects.
  return v;
});

expect.extend({
  toEq(received, expected) {
    const rec = purify(received);
    const exp = purify(expected);

    const pass = equals(rec, exp);

    // The following code is copied directly from
    // https://github.com/facebook/jest/blob/master/packages/expect/src/matchers.js
    /* eslint-disable */
    const message = pass
      ? () =>
          matcherHint('.not.toEqual') +
          '\n\n' +
          `Expected value to not equal:\n` +
          `  ${printExpected(expected)}\n` +
          `Received:\n` +
          `  ${printReceived(received)}`
      : () => {
          const diffString = diff(exp, rec, {
            expand: this.expand,
          });
          return (
            matcherHint('.toEqual') +
            '\n\n' +
            `Expected value to equal:\n` +
            `  ${printExpected(expected)}\n` +
            `Received:\n` +
            `  ${printReceived(received)}` +
            (diffString ? `\n\nDifference:\n\n${diffString}` : '')
          );
        };
    // Passing the the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {actual: received, expected, message, name: 'toEqual', pass};
    /* eslint-enable */
  },
});
