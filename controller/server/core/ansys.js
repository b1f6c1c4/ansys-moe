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
const fp = require('lodash/fp');
const { URL } = require('url');
const axios = require('axios');
const Papa = require('papaparse');
const amqp = require('../amqp');
const { hash, cIdGen, dedent } = require('../util');
const logger = require('../logger')('core/ansys');

module.exports.solve = ({ source, destination, inputs, outputs }, variables, info) => {
  logger.info('Run ansys solve', info);
  const id = cIdGen(info);
  const fn = destination.match(/([^/]*)\.[^.]*$/)[1];
  const grps = _.groupBy(outputs, fp.compose(hash, fp.omit(['name', 'column'])));
  const script = _.template(dedent`
    Dim oAnsoftApp
    Dim oProject
    Dim oDesign
    Dim oModule
    Set oAnsoftApp = CreateObject("AnsoftMaxwell.MaxwellScriptInterface")
    Set oProject = oAnsoftApp.GetAppDesktop().SetActiveProject("<%= fn %>")
    <% _.forEach(inputs, (i) => { %>
      <% if (i.design) { %>
        Set oDesign = oProject.SetActiveDesign("<%= i.design %>")
        oDesign.ChangeProperty _
      <% } else { %>
        oProject.ChangeProperty _
      <% } %>
          Array( _
            "NAME:AllTabs", _
            Array( _
      <% if (i.design) { %>
              "NAME:LocalVariableTab", _
              Array("NAME:PropServers", "LocalVariables"), _
      <% } else { %>
              "NAME:ProjectVariableTab", _
              Array("NAME:PropServers", "ProjectVariables"), _
      <% } %>
              Array( _
                "NAME:ChangedProps", _
                Array( _
                  "NAME:<%= i.name %>", _
                  "Value:=", _
                  "<%= variables[i.variable] %>" _
                ) _
              ) _
            ) _
          )
    <% }); %>
    oProject.AnalyzeAll
    <% _.forEach(grps, ([g], k) => { %>
      Set oDesign = oProject.SetActiveDesign("<%= g.design %>")
      Set oModule = oDesign.GetModule("ReportSetup")
      oModule.ExportToFile "<%= g.table %>", "$OUT_DIR/<%= k %>.csv"
    <% }); %>
  `)({ fn, inputs, variables, grps });
  amqp.publish('ansys', {
    type: 'solve',
    source,
    destination,
    script: script.replace(/\n\s*\n/g, '\n'),
  }, id, {
    cfg: info.cfgHash,
  });
};

const parseCsv = (file) => new Promise((resolve, reject) => {
  const url = process.env.STORAGE_URL + file;
  logger.trace('Will fetch csv', url);
  axios({
    method: 'get',
    url,
    responseType: 'stream',
  }).then((res) => {
    Papa.parse(res.data, {
      dynamicTyping: true,
      error: reject,
      complete: ({ data }) => {
        resolve(data);
      },
    });
  }).catch(reject);
});

module.exports.parse = async (payload, { outputs }) => {
  try {
    const grps = _.toPairs(_.groupBy(outputs, fp.compose(hash, fp.omit(['name', 'column']))));
    const res = await Promise.all(grps.map(([k]) => parseCsv(`/${payload.id}/output/${k}.csv`)));
    const mVars = _.fromPairs(_.flatten(_.zipWith(
      grps,
      res,
      ([, os], tbl) => os.map(({ name, column }) => [name, tbl[1][column]]),
    )));
    return mVars;
  } catch (e) {
    logger.error('Parsing ansys result', e);
    return null;
  }
};

let dest = new URL(process.env.STORAGE_URL).pathname;
if (!dest.startsWith('/storage')) {
  dest = `/storage${dest}`;
}

module.exports.store = async (payload, mHash) => {
  try {
    const cfg = {
      method: 'move',
      url: `${process.env.STORAGE_URL}/${payload.id}`,
      headers: {
        Destination: `${dest}/results/${mHash}`,
      },
    };
    logger.trace('Will move ansys', cfg);
    await axios(cfg);
    return true;
  } catch (e) {
    logger.error('Store ansys result', e);
    return false;
  }
};
