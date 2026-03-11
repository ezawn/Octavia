/**
 * Client-side Socket.IO handler for Octavia multiplayer
 * Manages communication with the server using Socket.IO
 * 
 * Note: Socket.IO client is loaded globally from CDN in index.html
 */

export class MultiplayerClient {
  constructor(serverUrl = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.playerId = null;
    this.roomId = null;
    this.otherPlayers = new Map();
    this.callbacks = new Map();
    this.isConnected = false;
  }

  /**
   * Connect to the Socket.IO server
   */
  connect(playerId) {
    return new Promise((resolve, reject) => {
      try {
        // Check if io is available globally (loaded from CDN)
        if (typeof window.io === 'undefined') {
          reject(new Error('Socket.IO client not loaded. Check that script tag is in index.html'));
          return;
        }

        this.socket = window.io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
          console.log('Connected to Socket.IO server');
          this.playerId = playerId;
          this.isConnected = true;
          this.setupMessageHandler();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.isConnected = false;
          this.triggerCallback('disconnect');
        });

      } catch (error) {
        console.error('Failed to create Socket.IO connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup message handler for server events
   */
  setupMessageHandler() {
    // Player joined room
    this.socket.on('roomJoined', (data) => {
      this.roomId = data.roomId;
      console.log(`Joined room: ${this.roomId}`);
      this.triggerCallback('roomJoined', data);
    });
    // Another player joined
    this.socket.on('playerJoined', (data) => {
      console.log(`${data.playerId} joined the room`);
      this.triggerCallback('playerJoined', data);
    });

    // Player left room
    this.socket.on('playerLeft', (data) => {
      console.log(`${data.playerId} left the room`);
      this.otherPlayers.delete(data.playerId);
      this.triggerCallback('playerLeft', data);
    });

    // Game starting
    this.socket.on('startGame', (data) => {
      console.log('Game starting with chart:', data.chartPath);
      this.triggerCallback('startGame', data);
    });
    // Real-time player update
    this.socket.on('playerUpdate', (data) => {
      this.otherPlayers.set(data.playerId, data.gameState);
      this.triggerCallback('playerUpdate', data);
    });

    // Game finished
    this.socket.on('gameFinished', (data) => {
      console.log(`${data.playerId} finished! Score: ${data.finalScore}, Accuracy: ${data.accuracy.toFixed(2)}%`);
      this.triggerCallback('gameFinished', data);
    });
    // Chat message received
    this.socket.on('chatMessage', (data) => {
      console.log(`${data.playerId}: ${data.message}`);
      this.triggerCallback('chatMessage', data);
    });
    // Error from server
    this.socket.on('error', (data) => {
      console.error('Server error:', data);
      if (data.message) {
        this.triggerCallback('serverError', data);
      }
    });
  }

  /**
   * Join a room (create new or join existing)
   */
  joinRoom(roomId = null) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.socket.emit('joinRoom', {
      playerId: this.playerId,
      roomId: roomId
    });

    console.log('[SENT] joinRoom event');
  }

  /**
   * Select a chart and start the game
   */
  selectChart(chartPath) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.socket.emit('selectChart', {
      chartPath: chartPath
    });

    console.log('[SENT] selectChart event');
  }

  //Send gamestate update
  updateGameState(gameState) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.socket.emit('updateGameState', {
      gameState: gameState
    });

    console.log('[SENT] updateGameState event');
  }

 //Send message with final score
  finishGame(finalScore, accuracy) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.socket.emit('finishGame', {
      finalScore: finalScore,
      accuracy: accuracy
    });

    console.log('[SENT] finishGame event');
  }

  //leave room
  leaveRoom() {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    this.socket.emit('leaveRoom');
    this.roomId = null;

    console.log('[SENT] leaveRoom event');
  }

  //Send chat message
  sendChat(message) {
    if (!this.isConnected) {
      console.error('[ERROR] Not connected to server');
      return;
    }

    if (!message || message.trim() === '') {
      console.warn('[WARNING] Cannot send empty message');
      return;
    }

    this.socket.emit('sendChat', {
      message: message.trim()
    });

    console.log('[SENT] sendChat event:', message);
  }

//dc from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

//Event callback
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
    return this.isConnected && this.socket && this.socket.connected;
  }
}
