const express = require('express');
const http = require('http');
const webSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });

app.use(express.static('public'));

// Store active game rooms
const rooms = new Map();

//Generate unique room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15); //Base 36, takes characters from index 2-15
}

/*Broadcast message to all players in a room
For example, when a player joins, leaves, or updates their game state, all clients will know*/
function broadcastToRoom(roomId, message) {
  if (!rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  room.players.forEach((player) => {
    if (player.ws.readyState === webSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    let playerId = null;
    let roomId = null;

    ws.send('Connected to Octavia server'); 

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'joinRoom':
                    playerId = message.playerId;
                    roomId = message.roomId || generateRoomId(); //Create new room if not provided

                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, {
                            players: new Map(),
                            chartPath: null,
                            status: 'waiting' // waiting, playing, finished
                        });
                    }

                    const room = rooms.get(roomId);
                    room.players.set(playerId, {
                        ws: ws,
                        gameState: null,
                        ready: false
                    });

                    // Send room info to all players
                    broadcastToRoom(roomId, {
                        type: 'playerJoined',
                        roomId: roomId,
                        playerId: playerId,
                        players: Array.from(room.players.keys()),
                        status: room.status
                    });

                    // Send room ID back to joining player
                    ws.send(JSON.stringify({
                        type: 'roomJoined',
                        roomId: roomId,
                        playerId: playerId
                    }));

                    console.log(`Player ${playerId} joined room ${roomId}`);
                    break;
                    //Host selects chart for players to play
                case 'selectChart': 
                    if (roomId && rooms.has(roomId)) {
                        const room = rooms.get(roomId);
                        room.chartPath = message.chartPath;
                        room.status = 'playing';
                        //Chart information broadcasted to all players
                        broadcastToRoom(roomId, {
                            type: 'startGame',
                            chartPath: message.chartPath
                        });

                        console.log(`Room ${roomId} started game with chart: ${message.chartPath}`);
                    }
                    break;
                    //Player updates their game state (score, health, etc.)
                case 'updateGameState':
                    if (roomId && rooms.has(roomId)) {
                        const room = rooms.get(roomId);
                        const player = room.players.get(playerId);

                        if (player) {
                            player.gameState = message.gameState;

                            // Broadcast updated game state to all players in room
                            broadcastToRoom(roomId, {
                                type: 'playerUpdate',
                                playerId: playerId,
                                gameState: message.gameState
                            });
                        }
                    }
                    break;

                case 'finishGame':
                    if (roomId && rooms.has(roomId)) {
                        const room = rooms.get(roomId);
                        room.status = 'finished';

                        broadcastToRoom(roomId, {
                            type: 'gameFinished',
                            playerId: playerId,
                            finalScore: message.finalScore,
                            accuracy: message.accuracy
                        });

                        console.log(`Player ${playerId} finished with score: ${message.finalScore}, accuracy: ${message.accuracy}%`);
                    }
                    break;

                case 'leaveRoom':
                    if (roomId && rooms.has(roomId)) {
                        const room = rooms.get(roomId);
                        room.players.delete(playerId);

                        broadcastToRoom(roomId, {
                            type: 'playerLeft',
                            playerId: playerId,
                            remainingPlayers: Array.from(room.players.keys())
                        });

                        // Delete room if empty
                        if (room.players.size === 0) {
                            rooms.delete(roomId);
                            console.log(`Room ${roomId} deleted (empty)`);
                        }
                    }
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.players.delete(playerId);

            broadcastToRoom(roomId, {
                type: 'playerLeft',
                playerId: playerId,
                remainingPlayers: Array.from(room.players.keys())
            });

            if (room.players.size === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            }
        }
        console.log(`Player ${playerId} disconnected from room ${roomId}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
    console.log('WebSocket multiplayer enabled');
});

// Log room status periodically
setInterval(() => {
    if (rooms.size > 0) {
        console.log(`\nActive rooms: ${rooms.size}`);
        rooms.forEach((room, roomId) => {
            console.log(`  Room ${roomId}: ${room.players.size} players, status: ${room.status}`);
        });
    }
}, 30000);