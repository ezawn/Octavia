const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static("public"));

//contains active rooms
const rooms = new Map();

//Make an ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15);
}

//Send various events to players
function broadcastToRoom(roomId, eventName, data) {
  io.to(roomId).emit(eventName, data);
  console.log(`Broadcasted "${eventName}" to room ${roomId}`);
}

//get players in room
function getRoomPlayers(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    return Array.from(room.players.keys());
} else {
    return [];
}
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let playerId = null;
  let roomId = null;

  // Event 1: Player joins room
  socket.on("joinRoom", (data) => {
    try {
      playerId = data.playerId;
      roomId = data.roomId || generateRoomId();

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          players: new Map(),
          chartPath: null,
          status: "waiting"
        });
        console.log(`Created room: ${roomId}`);
      }

      const room = rooms.get(roomId);
      room.players.set(playerId, {
        socket: socket,
        gameState: null,
        ready: false
      });

      socket.join(roomId);

      // Send confirmation to joining player
      socket.emit("roomJoined", {
        roomId: roomId,
        playerId: playerId,
        players: getRoomPlayers(roomId)
      });

      // Notify other players in room
      socket.to(roomId).emit("playerJoined", {
        playerId: playerId,
        players: getRoomPlayers(roomId),
        status: room.status
      });

      console.log(`Player ${playerId} joined room ${roomId}`);
      console.log(`   Room now has ${room.players.size} players`);

    } catch (error) {
      console.error("Error in joinRoom:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Event 2: Host selects a chart
  socket.on("selectChart", (data) => {
    try {
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.chartPath = data.chartPath;
        room.status = "playing";

        broadcastToRoom(roomId, "startGame", {
          chartPath: data.chartPath
        });

        console.log(`Room ${roomId} started game with chart: ${data.chartPath}`);
      }
    } catch (error) {
      console.error("Error in selectChart:", error);
      socket.emit("error", { message: "Failed to select chart" });
    }
  });

  // Event 3: Player updates game state during gameplay
  socket.on("updateGameState", (data) => {
    try {
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const player = room.players.get(playerId);

        if (player) {
          player.gameState = data.gameState;

          broadcastToRoom(roomId, "playerUpdate", {
            playerId: playerId,
            gameState: data.gameState
          });
        }
      }
    } catch (error) {
      console.error("Error in updateGameState:", error);
    }
  });

  // Event 4: Player finishes game
  socket.on("finishGame", (data) => {
    try {
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.status = "finished";

        broadcastToRoom(roomId, "gameFinished", {
          playerId: playerId,
          finalScore: data.finalScore,
          accuracy: data.accuracy
        });

        console.log(`Player ${playerId} finished with score: ${data.finalScore}, accuracy: ${data.accuracy.toFixed(2)}%`);
      }
    } catch (error) {
      console.error("Error in finishGame:", error);
      socket.emit("error", { message: "Failed to finish game" });
    }
  });

  // Event 5: Player leaves room intentionally
  socket.on("leaveRoom", () => {
    try {
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.players.delete(playerId);

        // Notify remaining players
        socket.to(roomId).emit("playerLeft", {
          playerId: playerId,
          remainingPlayers: getRoomPlayers(roomId)
        });

        // Delete room if empty
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }

        socket.leave(roomId);
        console.log(`Player ${playerId} left room ${roomId}`);
      }
    } catch (error) {
      console.error("Error in leaveRoom:", error);
    }
  });

  // Event 6: Player disconnects (browser closed, connection lost)
  socket.on("disconnect", () => {
    try {
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.players.delete(playerId);

        // Notify remaining players
        socket.to(roomId).emit("playerLeft", {
          playerId: playerId,
          remainingPlayers: getRoomPlayers(roomId)
        });

        // Delete room if empty
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }

      console.log(`Player ${playerId} disconnected from room ${roomId}`);
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });

  // Event 7: Chat message
  socket.on("sendChat", (data) => {
    try {
      if (roomId && rooms.has(roomId)) {
        socket.to(roomId).emit("chatMessage", {
          playerId: playerId,
          message: data.message,
          timestamp: Date.now()
        });
        console.log(`Chat from ${playerId} in room ${roomId}: ${data.message}`);
      }
    } catch (error) {
      console.error("Error in sendChat:", error);
    }
  });

  // Event 8: Socket error handler
  socket.on("error", (error) => {
    console.error(`Socket error for ${playerId}:`, error);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
  console.log("WebSocket multiplayer enabled");
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
