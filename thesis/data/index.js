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
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const util = require('util');
const stripBom = require('strip-bom');
const Papa = require('papaparse');
const yargs = require('yargs');
const tmp = require('tmp-promise');
const cp = require('child_process');

process.on('unhandledRejection', (e) => {
  throw e;
});

process.on('uncaughtException', (e) => {
  console.error(e);
});

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const execFile = util.promisify(cp.execFile);

const { argv } = yargs
  .usage('$0 [csv] -o [tex]')
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

const runRscript = async (script) => {
  const f = await tmp.file({ prefix: 'data-', postfix: '.R' });
  try {
    await writeFile(f.path, script);
    const res = await execFile('Rscript', ['--vanilla', f.path]);
    if (res.code) {
      console.error(res.stderr);
      throw res;
    }
    return res.stdout;
  } finally {
    f.cleanup();
  }
};

const tmpl = _.template(fs.readFileSync(path.join(__dirname, 'template.tex'), 'utf-8'));

const run = async () => {
  const data = await readin();
  const quote = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const pathCommon = path.join(__dirname, './common.R');
  const pathInput = argv._[0];
  const [opts, nums] = (await runRscript(`
    sink(stderr());
    library(jsonlite);
    source("${quote(pathCommon)}");
    data <- getData("${quote(pathInput)}");
    sink();
    print(toJSON(data$opt));
    print(toJSON(list(
      raw=nrow(data$raw),
      valid=nrow(data$raw[data$raw$P0 < 0, ]),
      fea=nrow(data$fea),
      opt=nrow(data$opt)
    )));
  `)).trim().split('\n').map(_.unary(JSON.parse));;
  const fields = ['dCoilTurns', 'dCoilOuter', 'dCoilInner', 'dShieldThickness', 'dShieldExtra'];
  const res = tmpl({
    opts: _.sortBy(opts, fields),
    nums,
  });
  await writeout(res);
  // const res = _.map(opts, _.unary(tmpl));
  // await writeout(JSON.stringify(res, null, 2));
};

run();
