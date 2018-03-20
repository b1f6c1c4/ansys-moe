const JSON5 = require('json5');
const express = require('express');
const http = require('http');
const EventEmitter = require('events');
const WebSocket = require('ws');

const app = express();

app.use('/', express.static('public'));

const server = http.createServer(app);

const wss1 = new WebSocket.Server({ port: 64381 });
const wss2 = new WebSocket.Server({ server });

const broadcast = (wss) => (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const ev12 = new EventEmitter();
const ev21 = new EventEmitter();

ev12.on('msg', broadcast(wss2));
ev21.on('msg', broadcast(wss1));

wss1.on('connection', (ws) => {
  ws.on('message', (msg) => {
    console.log('From wss1', msg);
    ev12.emit('msg', msg);
  });
});

wss2.on('connection', (ws) => {
  ws.on('message', (m) => {
    const { from, to, pars } = JSON5.parse(m);
    let Script;
    if (pars) {
      const sets = [];
      Object.keys(pars).forEach((k) => {
        sets.push(`
oProject.ChangeProperty([
    "NAME:AllTabs",
    [
      "NAME:ProjectVariableTab",
      ["NAME:PropServers", "ProjectVariables"],
      ["NAME:ChangedProps", ["NAME:${k}", "Value:=", "${pars[k]}"]]
    ]
  ])
`);
      });
      Script = `
import ScriptEnv
ScriptEnv.Initialize("Ansoft.ElectronicsDesktop")
oDesktop.RestoreWindow()
oProject = oDesktop.SetActiveProject("${from}")
${sets.join('\n')}
`;
    }
    const cmd = {
      Name: to,
      FileName: `${from}.aedt`,
      Script,
    };
    console.log('Command', cmd);
    ev21.emit('msg', JSON.stringify(cmd));
  });
});

server.listen(64382, () => {
  console.log(`Listening on ${server.address().port}`);
});
