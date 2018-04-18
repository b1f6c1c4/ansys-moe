const _ = require('lodash');
const fp = require('lodash/fp');
const amqp = require('../amqp');
const { hash, dedent } = require('../util');
const logger = require('../logger')('core/ansys');

module.exports.mutate = ({ filename, inputs }, variables, { proj, name, root }) => {
  logger.info('Run ansys mutate', { proj, name, root });
  const id = root
    ? `${proj}.${name}${root.replace(/\//g, '.')}`
    : `${proj}.${name}`;
  const fn = filename.substr(0, filename.lastIndexOf('.'));
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
  `)({ fn, inputs, variables });
  amqp.publish('ansys', {
    type: 'mutate',
    file: filename,
    script: script.replace(/\n\s*\n/g, '\n'),
  }, id);
};

module.exports.solve = (filename, { outputs }, { proj, name, root }) => {
  logger.info('Run ansys solve', { proj, name, root });
  const id = root
    ? `${proj}.${name}${root.replace(/\//g, '.')}`
    : `${proj}.${name}`;
  const fn = filename.substr(0, filename.lastIndexOf('.'));
  const grps = _.groupBy(outputs, fp.compose(hash, fp.omit('name')));
  const script = _.template(dedent`
    Dim oAnsoftApp
    Dim oProject
    Dim oDesign
    Dim oModule
    Set oAnsoftApp = CreateObject("AnsoftMaxwell.MaxwellScriptInterface")
    Set oProject = oAnsoftApp.GetAppDesktop().SetActiveProject("<%= fn %>")
    <% _.forEach(grps, ([g], k) => { %>
      Set oDesign = oProject.SetActiveDesign("<%= g.design %>")
      Set oModule = oDesign.GetModule("ReportSetup")
      oModule.ExportToFile "<%= g.table %>", "$OUT_DIR/<%= k %>.csv"
    <% }); %>
  `)({ fn, grps });
  amqp.publish('ansys', {
    type: 'solve',
    file: filename,
    script,
  }, id);
};
