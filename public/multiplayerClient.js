/**
 * Client-side WebSocket handler for Octavia multiplayer
 * Manages communication with the server
 */

export class MultiplayerClient {
  constructor(serverUrl = 'ws://localhost:3000') {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.playerId = null;
    this.roomId = null;
    this.otherPlayers = new Map();
    this.callbacks = new Map(); 
    this.isConnected = false;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(playerId) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to multiplayer server');
          this.playerId = playerId;
          this.isConnected = true;
          this.setupMessageHandler();
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from server');
          this.isConnected = false;
          this.triggerCallback('disconnect');
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup message handler for server events
   */
  setupMessageHandler() {
    this.ws.onmessage = (event) => {
      try {
        // Handle both string and object messages
        let message;
        if (typeof event.data === 'string') {
          // Check if it's JSON or plain text
          if (event.data.startsWith('{')) {
            message = JSON.parse(event.data);
          } else {
            console.log('Server:', event.data);
            return;
          }
        } else {
          message = event.data;
        }

        console.log('Received:', message.type);

        switch (message.type) {
          case 'roomJoined':
            this.roomId = message.roomId;
            console.log(`Joined room: ${this.roomId}`);
            this.triggerCallback('roomJoined', message);
            break;

          case 'playerJoined':
            console.log(`${message.playerId} joined the room`);
            this.triggerCallback('playerJoined', message);
            break;

          case 'playerLeft':
            console.log(`${message.playerId} left the room`);
            this.otherPlayers.delete(message.playerId);
            this.triggerCallback('playerLeft', message);
            break;

          case 'startGame':
            console.log('Game starting with chart:', message.chartPath);
            this.triggerCallback('startGame', message);
            break;

          case 'playerUpdate':
            this.otherPlayers.set(message.playerId, message.gameState);
            this.triggerCallback('playerUpdate', message);
            break;

          case 'gameFinished':
            console.log(`${message.playerId} finished! Score: ${message.finalScore}, Accuracy: ${message.accuracy.toFixed(2)}%`);
            this.triggerCallback('gameFinished', message);
            break;

          default:
            console.log(' Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };
  }

  /**
   * Join a room (create new or join existing)
   */
  joinRoom(roomId = null) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.send({
      type: 'joinRoom',
      playerId: this.playerId,
      roomId: roomId
    });
  }

  /**
   * Select a chart and start the game
   */
  selectChart(chartPath) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.send({
      type: 'selectChart',
      chartPath: chartPath
    });
  }

  /**
   * Send game state update during gameplay
   */
  updateGameState(gameState) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.send({
      type: 'updateGameState',
      gameState: gameState
    });
  }

  /**
   * Send game finished message with final score
   */
  finishGame(finalScore, accuracy) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.send({
      type: 'finishGame',
      finalScore: finalScore,
      accuracy: accuracy
    });
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.send({
      type: 'leaveRoom'
    });

    this.disconnect();
  }

  /**
   * Send a message to the server
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ERROR] WebSocket not ready');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      console.log('[SENT] Message:', message.type);
    } catch (error) {
      console.error('[ERROR] Error sending message:', error);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Register event callback
   * @param {string} event - Event name (roomJoined, playerJoined, startGame, etc.)
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  /**
   * Trigger event callbacks
   */
  triggerCallback(event, data = null) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[ERROR] Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Get other players' game states
   */
  getOtherPlayers() {
    return this.otherPlayers;
  }

  /**
   * Get a specific player's game state
   */
  getPlayerState(playerId) {
    return this.otherPlayers.get(playerId);
  }

  /**
   * Get current room ID
   */
  getRoomId() {
    return this.roomId;
  }

  /**
   * Get current player ID
   */
  getPlayerId() {
    return this.playerId;
  }

  /**
   * Check if connected
   */
  isConnectedToServer() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
