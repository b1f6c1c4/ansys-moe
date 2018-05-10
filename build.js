/* eslint-disable no-console */

const shelljs = require('shelljs');
const Bundler = require('parcel-bundler');

if (!shelljs.which('docker')) {
  console.log('Sorry, this script requires docker');
  shelljs.exit(1);
}

shelljs.rm('-rf', 'dist');
const bundler = new Bundler('index.html', {
  sourceMaps: false,
});
bundler.bundle().then(() => {
  shelljs.cp('Dockerfile', 'dist');
  shelljs.cp('.dockerignore', 'dist');
  shelljs.exec('docker build -t ansys-frontend dist');
});
