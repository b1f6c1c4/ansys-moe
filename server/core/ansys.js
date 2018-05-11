const _ = require('lodash');
const fp = require('lodash/fp');
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
  const grps = _.toPairs(_.groupBy(outputs, fp.compose(hash, fp.omit(['name', 'column']))));
  const res = await Promise.all(grps.map(([k]) => parseCsv(`/${payload.id}/output/${k}.csv`)));
  const mVars = _.fromPairs(_.flatten(_.zipWith(
    grps,
    res,
    ([, os], tbl) => os.map(({ name, column }) => [name, tbl[1][column]]),
  )));
  return mVars;
};
