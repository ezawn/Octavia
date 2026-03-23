//manage communication with server





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

  //connect to server
  connect(playerId) {
    return new Promise((resolve, reject) => {
      try {
        //ensure io works before proceeding
        if (typeof window.io === 'undefined') {
          reject(new Error('Socket.io not functioning'));
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

  //message handler for different events
  setupMessageHandler() {
    // Player joined room
    this.socket.on('roomJoined', (data) => {
      this.roomId = data.roomId;
      console.log(`Joined room: ${this.roomId}`);
      this.triggerCallback('roomJoined', data);
    });
    //player joins
    this.socket.on('playerJoined', (data) => {
      console.log(`${data.playerId} joined the room`);
      this.triggerCallback('playerJoined', data);
    });

    //player leaves room
    this.socket.on('playerLeft', (data) => {
      console.log(`${data.playerId} left the room`);
      this.otherPlayers.delete(data.playerId);
      this.triggerCallback('playerLeft', data);
    });

    //Game starts
    this.socket.on('startGame', (data) => {
      console.log('Game starting with chart:', data.chartPath);
      this.triggerCallback('startGame', data);
    });
    // UPdates gamestate
    this.socket.on('playerUpdate', (data) => {
      this.otherPlayers.set(data.playerId, data.gameState);
      this.triggerCallback('playerUpdate', data);
    });

    //Finish chart
    this.socket.on('gameFinished', (data) => {
      console.log(`${data.playerId} finished! Score: ${data.finalScore}, Accuracy: ${data.accuracy.toFixed(2)}%`);
      this.triggerCallback('gameFinished', data);
    });
    //Receive a message
    this.socket.on('chatMessage', (data) => {
      console.log(`${data.playerId}: ${data.message}`);
      this.triggerCallback('chatMessage', data);
    });
    //Error
    this.socket.on('error', (data) => {
      console.error('Server error:', data);
      if (data.message) {
        this.triggerCallback('serverError', data);
      }
    });
  }

  //join a room, or create it if it doesn;t exist
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

  //Pick a chart, start the game
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

  //send msg
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

//event callback, handles various events
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  //trigger event callback
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

  //get others gamestates
  getOtherPlayers() {
    return this.otherPlayers;
  }

  //get a players gamestate
  getPlayerState(playerId) {
    return this.otherPlayers.get(playerId);
  }

  //get room id
  getRoomId() {
    return this.roomId;
  }

  //get id
  getPlayerId() {
    return this.playerId;
  }

  //confirm connection
  isConnectedToServer() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}
