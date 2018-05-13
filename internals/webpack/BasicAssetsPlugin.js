const _ = require('lodash');

class BasicAssetsPlugin {
  constructor(options) {
    this.append = options.append || [];
    this.remove = options.remove;
  }

  apply(compiler) {
    compiler.hooks.emit.tap('BasicAssetsPlugin', (compilation) => {
      if (_.isFunction(this.remove)) {
        _.keys(compilation.assets)
          .filter(this.remove)
          .forEach((a) => {
            // eslint-disable-next-line no-param-reassign
            delete compilation.assets[a];
          });
      }

      const obj = _.mapValues(this.append, (o) => {
        if (_.isString(o)) {
          const data = o.trimLeft();
          return {
            source: () => data,
            size: () => data.length,
          };
        }

        if (_.isFunction(o)) {
          const data = o(compilation).trimLeft();
          return {
            source: () => data,
            size: () => data.length,
          };
        }

        return null;
      });

      _.assign(compilation.assets, obj);
    });
  }
}

module.exports = BasicAssetsPlugin;
