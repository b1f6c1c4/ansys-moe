const _ = require('lodash');
const fp = require('lodash/fp');
const amqp = require('../amqp');
const { hash, dedent } = require('../util');
const logger = require('../logger')('core/ansys');

module.exports.mutate = (file, { inputs }, variables, { proj, name, root }) => {
  logger.info('Run ansys mutate', { proj, name, root });
  const id = root
    ? `${proj}.${name}${root.replace(/\//g, '.')}`
    : `${proj}.${name}`;
  const script = _.template(dedent`
    Dim oAnsoftApp
    Dim oProject
    Dim oDesign
    Dim oModule
    Set oAnsoftApp = CreateObject("AnsoftMaxwell.MaxwellScriptInterface")
    Set oProject = oAnsoftApp.GetAppDesktop().GetActiveProject()
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
  `)({ inputs, variables });
  amqp.publish('ansys', {
    type: 'mutate',
    file,
    script,
  }, id);
};

module.exports.solve = (file, { outputs }, { proj, name, root }) => {
  logger.info('Run ansys solve', { proj, name, root });
  const id = root
    ? `${proj}.${name}${root.replace(/\//g, '.')}`
    : `${proj}.${name}`;
  const grps = _.groupBy(outputs, fp.compose(hash, _.omit('name')));
  const script = _.template(dedent`
    Dim oAnsoftApp
    Dim oProject
    Dim oDesign
    Dim oModule
    Set oAnsoftApp = CreateObject("AnsoftMaxwell.MaxwellScriptInterface")
    Set oProject = oAnsoftApp.GetAppDesktop().GetActiveProject()
    <% _.forEach(grps, ([g], k) => { %>
      Set oDesign = oProject.SetActiveDesign("<%= g.design %>")
      Set oModule = oDesign.GetModule("ReportSetup")
      oModule.ExportToFile "<%= g.table %>", "$OUT_DIR/<%= k %>.csv"
    <% }); %>
  `)({ grps });
  amqp.publish('ansys', {
    type: 'solve',
    file,
    script,
  }, id);
};
