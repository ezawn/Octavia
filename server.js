const express = require('express');
const http = require('http');
const webSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send('Connected to Octavia server');
});

server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});