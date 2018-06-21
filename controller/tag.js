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
const shelljs = require('shelljs');
const fs = require('fs');

const generateStatus = () => {
  if (!shelljs.which('git')) {
    return undefined;
  }

  const ver = shelljs.exec('git describe --always', { silent: true });
  const hsh = shelljs.exec('git rev-parse HEAD', { silent: true });
  if (ver.code !== 0 || hsh.code !== 0) {
    return undefined;
  }

  return {
    version: ver.stdout.trim(),
    commitHash: hsh.stdout.trim(),
  };
};

const st = generateStatus();
if (st) {
  fs.writeFile('VERSION.json', JSON.stringify(st), 'utf8', (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
}
