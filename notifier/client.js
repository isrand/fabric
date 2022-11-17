const websocket = require('ws');

const ws = new websocket.WebSocket('ws://localhost:8080');

ws.on('message', function message(data) {
  console.log('%s', data);
});