const _ = require('lodash');
const path = require('path');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const transformImports = require('babel-plugin-transform-imports');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const {
  AdvancedInjectionPlugin,
  Prefetch,
  Preload,
  AsyncCss,
  InlineCss,
  Js,
  InlineJs,
} = require('advanced-injection-plugin');
const BasicAssetsPlugin = require('./BasicAssetsPlugin');

const extractCss0 = new ExtractTextPlugin({
  filename: 'assets/[name].[contenthash:8].css',
  allChunks: true,
});
const extractCss1 = new ExtractTextPlugin({
  filename: 'assets/[name].vendor.[contenthash:8].css',
  allChunks: true,
});

const minify = {
  removeComments: true,
  collapseWhitespace: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  keepClosingSlash: true,
  minifyJS: true,
  minifyCSS: true,
  minifyURLs: false,
};

module.exports = require('./webpack.base')({
  mode: 'production',

  // In production, we skip all hot-reloading stuff
  entry: {
    mock: [
      'file-loader?name=[name].[ext]!resource/favicon.ico',
      'file-loader?name=assets/[name].[hash:8].[ext]!fg-loadcss/dist/cssrelpreload.min.js',
      'file-loader?name=assets/[name].[hash:8].[ext]!outdatedbrowser/outdatedbrowser/outdatedbrowser.min.css',
    ],
    index: [
      'index/style.js',
      'index/index.js',
    ],
    app: [
      'root.js',
    ],
  },

  babelOptions: {
    plugins: [
      'lodash',
      [
        transformImports,
        {
          'material-ui-icons': {
            // eslint-disable-next-line no-template-curly-in-string
            transform: 'material-ui-icons/${member}',
            preventFullImport: true,
          },
        },
      ],
    ],
  },

  workerName: 'assets/[chunkhash:8].worker.js',

  cssLoaderVender: extractCss1.extract({
    fallback: 'style-loader',
    use: [{
      loader: 'css-loader',
      options: {
        minimize: true,
        sourceMap: !!process.env.SOURCE_MAP,
      },
    }],
  }),
  cssLoaderApp: extractCss0.extract({
    fallback: 'style-loader',
    use: [{
      loader: 'css-loader',
      options: {
        minimize: true,
        sourceMap: !!process.env.SOURCE_MAP,
      },
    }],
  }),

  minify,
  inject: false,

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    path: path.join(__dirname, '../../build'),
    filename: 'assets/[name].[chunkhash:8].js',
    chunkFilename: 'assets/[name].[chunkhash:8].chunk.js',
  },

  optimization: {
    concatenateModules: true,
    splitChunks: {
      minChunks: 4,
      name: false,
    },
    minimize: true,
    minimizer: [{
      apply: (compiler) => new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: !!process.env.SOURCE_MAP,
        uglifyOptions: {
          ecma: 8,
          compress: {
            // [#2842](https://github.com/mishoo/UglifyJS2/issues/2842)
            inline: 1,
          },
          output: {
            comments: false,
          },
        },
      }).apply(compiler),
    }],
  },

  plugins: [
    new GitRevisionPlugin(),
    extractCss0,
    extractCss1,
    new AdvancedInjectionPlugin({
      prefix: 'assets/',
      rules: [{
        match: ['index.html', 'app.html'],
        head: [
          // outdatedbrowser.min.css
          new AsyncCss(/^outdatedbrowser\..*\.css$/),
        ],
      }, {
        match: 'index.html',
        head: [
          // index.vendor.css
          new AsyncCss(/^index\.vendor\..*\.css$/),
          // index.css
          new InlineCss(/^index\.(?!vendor).*\.css$/),
          // index.js
          new Preload(/^index\..*\.js$/, { as: 'script' }),
          // roboto-latin-400.woff2 roboto-latin-300.woff2
          new Preload(/^roboto-latin-[34]00\..*\.woff2$/, { as: 'font' }),
          // NotoSansSC-Regular-X.woff2 NotoSansSC-Light-X.woff2
          new Preload(/^NotoSansSC-(Regular|Light)-X\..*\.woff2$/, { as: 'font' }),
          // app.js
          new Prefetch(/^app\..*\.js$/),
          // app.css
          new Prefetch(/^app\..*\.css$/),
          // 0.chunk.js
          new Prefetch(/^[0-9]+\..*\.chunk\.js$/, { as: 'script' }),
          // LoginContainer.chunk.js
          new Prefetch(/^LoginContainer.*\.chunk\.js$/),
          // HomeContainer.chunk.js
          new Prefetch(/^HomeContainer.*\.chunk\.js$/),
          // NotoSansSC-Regular.woff2
          new Prefetch(/^NotoSansSC-Regular\..*\.woff2$/),
        ],
        body: [
          // index.js
          new Js(/^index\..*\.js$/),
        ],
      }, {
        match: 'app.html',
        head: [
          // app.vendor.css
          new AsyncCss(/^app\.vendor\..*\.css$/),
          // app.css
          new InlineCss(/^app\.(?!vendor).*\.css$/),
          // app.js common-app.chunk.js
          new Preload(/^(common-)?app\..*\.js$/, { as: 'script' }),
          // roboto-latin-400.woff2 roboto-latin-300.woff2
          new Preload(/^roboto-latin-[34]00\..*\.woff2$/, { as: 'font' }),
          // NotoSansSC-Regular-X.woff2 NotoSansSC-Light-X.woff2
          new Preload(/^NotoSansSC-(Regular|Light)-X\..*\.woff2$/, { as: 'font' }),
          // NotoSansSC-Regular.woff2
          new Prefetch(/^NotoSansSC-Regular\..*\.woff2$/),
          // *.chunk.js
          new Prefetch(/\.chunk\.js$/),
          // *.worker.js
          new Prefetch(/^.*\.worker\.js$/),
        ],
        body: [
          // app.js
          new Js(/^app\..*\.js$/),
        ],
      }, {
        match: ['index.html', 'app.html'],
        head: [
          // cssrelpreload.min.js
          new InlineJs(/^cssrelpreload\..*\.js$/),
        ],
      }],
    }),
    new BasicAssetsPlugin({
      remove: (a) => /^mock\../.test(a.replace(/^assets\//, '')),
      append: {
        'robots.txt': `
User-Agent: *
Disallow: /*
Allow: /$
`,
        _redirects: `
/app/* /app.html 200!
/secret/* /secret/ 302
`,
        _headers: (compilation) => {
          const entry = (e) => compilation.outputOptions.publicPath + e;
          const makePreload = (reg, as) => _.keys(compilation.assets)
            .filter((a) => reg.test(a.replace(/^assets\//, '')))
            .map((a) => `  Link: <${entry(a)}>; rel=preload; as=${as}`);
          const makeIndex = () => {
            const preloads = [];
            // outdatedbrowser.min.css
            preloads.push(...makePreload(/^outdated(browser)?\..*\.css/, 'style'));
            // index.css index.vender.css
            preloads.push(...makePreload(/^index\..*\.css/, 'style'));
            // index.js
            preloads.push(...makePreload(/^index\..*\.js$/, 'script'));
            return preloads.join('\n');
          };
          const makeApp = () => {
            const preloads = [];
            // outdatedbrowser.min.css
            preloads.push(...makePreload(/^outdated(browser)?\..*\.css/, 'style'));
            // app.css
            preloads.push(...makePreload(/^app\..*\.css/, 'style'));
            // app.js
            preloads.push(...makePreload(/^app\..*\.js$/, 'script'));
            // 0.chunk.js
            preloads.push(...makePreload(/^[0-9]+\..*\.chunk\.js$/, 'script'));
            return preloads.join('\n');
          };
          return `
/
${makeIndex()}
  Cache-Control: public, max-age=0, must-revalidate
/app/*
${makeApp()}
  Cache-Control: public, max-age=0, must-revalidate
/secret/*
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=3153600
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
`;
        },
      },
    }),
  ],

  devtool: process.env.SOURCE_MAP ? 'source-map' : undefined,

  performance: {
    assetFilter: (assetFilename) => !(/(\.map$)|(^(favicon\.))/.test(assetFilename)),
  },
});
