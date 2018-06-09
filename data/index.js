const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const stripBom = require('strip-bom');
const Papa = require('papaparse');
const yargs = require('yargs');

process.on('unhandledRejection', (e) => {
  throw e;
});

process.on('uncaughtException', (e) => {
  console.error(e);
});

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const { argv } = yargs
  .usage('$0 [csv] -o [tex]')
  .option('t', {
    alias: 'top-items',
    demandOption: true,
    default: 5,
    describe: 'how many',
    type: 'integer',
  })
  .option('o', {
    alias: 'output',
    demandOption: true,
    default: '-',
    describe: 'output file; - for stdout',
    type: 'string',
  });

if (argv._.length !== 1) {
  throw new Error('Exactly one file at a time');
}

const readin = async () => {
  const f = stripBom(await readFile(argv._[0], 'utf-8')).replace('目标函数', 'P0');
  const { data, error } = Papa.parse(f, {
    header: true,
  });
  if (error && error.length) {
    throw new Error(error);
  }
  return data;
};

const writeout = async (data) => {
  if (argv.output === '-') {
    process.stdout.write(data);
  } else {
    await writeFile(argv.output, data, 'utf-8');
  }
};

const run = async () => {
  const data = await readin();
  const sorted = _.sortBy(data, 'P0');
  sorted.splice(0, sorted.length - argv.topItems);
  await writeout(JSON.stringify(sorted, null, 2));
};

run();
