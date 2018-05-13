/* eslint-disable no-console */
/* eslint-disable global-require */

const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const make = (makeConfig, { progress, profile }) => {
  if (profile) {
    process.env.SOURCE_MAP = 'true';
  } else {
    delete process.env.SOURCE_MAP;
  }

  const config = makeConfig();
  const compiler = webpack(config);
  if (progress) {
    compiler.apply(new webpack.ProgressPlugin());
  }

  compiler.run((err, stats) => {
    if (err) {
      console.error(err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }

    if (profile) {
      const json = JSON.stringify(stats.toJson(), null, 2);
      fs.writeFileSync(path.join(__dirname, '../../stats.json'), json, 'utf-8');
    }

    console.log(stats.toString(config.stats));
  });
};

yargs
  .usage('$0 <cmd> [args]')
  .help()
  .version(false)
  .options({
    progress: {
      type: 'boolean',
      default: true,
      description: 'Use ProgressPlugin',
    },
  })
  .command('$0', 'Build frontend', (args) => {
    args.options({
      profile: {
        type: 'boolean',
        description: 'Generate stats.json and source map',
      },
    });
  }, (argv) => {
    make(() => require('../webpack/webpack.prod'), argv);
  })
  .command('dll', 'Build dll', () => {}, (argv) => {
    make(() => require('../webpack/webpack.dll'), argv);
  })
  .parse();
