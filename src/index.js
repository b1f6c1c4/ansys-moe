const EventEmitter = require('events');
const WebSocket = require('ws');

const wss1 = new WebSocket.Server({ port: 64381 });
const wss2 = new WebSocket.Server({ port: 64382 });

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
  ws.on('message', (msg) => {
    console.log('From wss2', msg);
    ev21.emit('msg', msg);
  });
});
