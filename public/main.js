import { handleKeyPress } from "./inputHandler.js";
import { loadLevels, loadSettings, drawMenu, handleMenuKeyPress, resetLevelSelection, setRoomInfo, updatePlayerCount, showStatusMessage, clearRoomInfo, getScrollSpeedMultiplier, setScrollSpeedMultiplier, drawSettingsMenu } from "./menu.js";
import { startGame } from "./game.js";
import { MultiplayerClient } from "./multiplayerClientSocket.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menuContainer = document.getElementById("menuContainer");
const multiplayerMenuContainer = document.getElementById("multiplayerMenuContainer");
const gameContainer = document.getElementById("gameContainer");
const playBtn = document.getElementById("playBtn");
const multiplayerBtn = document.getElementById("multiplayerBtn");
const backToMainBtn = document.getElementById("backToMainBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const startGameBtn = document.getElementById("startGameBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const settingsBtn = document.getElementById("settingsBtn");
const chatContainer = document.getElementById("chatContainer");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatInputContainer = document.getElementById("chatInputContainer");
const chatDivider = document.getElementById("chatDivider");

let gameMode = "bootstrap-menu"; // bootstrap-menu, multiplayer-menu, canvas-menu, settings, or game
let currentChartPath = null;
let menuLoopRunning = false;
let multiplayerClient = null;
let isMultiplayer = false;
let isConnectingToMultiplayer = false;
let isInRoom = false;

async function initializeGame() {
  await loadLevels();
  loadSettings();
  resetLevelSelection();
}

//Update UI based on room state
function updateRoomUI() {
  if (isInRoom) {
    //If in room show leave and start game buttons, hide join/create
    leaveRoomBtn.classList.remove("d-none");
    startGameBtn.classList.remove("d-none");
    joinRoomBtn.classList.add("d-none");
    createRoomBtn.classList.add("d-none");
    roomCodeInput.classList.add("d-none");
    chatContainer.classList.remove("d-none");
    chatInputContainer.classList.remove("d-none");
    chatDivider.classList.remove("d-none");
    showStatusMessage('You are in a room. Select a chart to start the game or click "LEAVE ROOM" to exit.', 'warning');
  } else {
    //If not in room, hide leave and start game buttons, show join/create
    leaveRoomBtn.classList.add("d-none");
    startGameBtn.classList.add("d-none");
    joinRoomBtn.classList.remove("d-none");
    createRoomBtn.classList.remove("d-none");
    roomCodeInput.classList.remove("d-none");
    chatContainer.classList.add("d-none");
    chatInputContainer.classList.add("d-none");
    chatDivider.classList.add("d-none");
  }
}

// Canvas-based menu loop (used when coming from bootstrap menu)
function menuLoop() {
  if (!menuLoopRunning) return;
  
  if (gameMode === "settings") {
    drawSettingsMenu(ctx, canvas);
  } else {
    drawMenu(ctx, canvas);
  }
  requestAnimationFrame(menuLoop);
}

// Display a chat message in the chat container
function displayChatMessage(playerId, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message";
  
  const isCurrentPlayer = multiplayerClient && multiplayerClient.getPlayerId() === playerId;
  messageDiv.classList.add(isCurrentPlayer ? "chat-message-player" : "chat-message-other");
  
  const playerNameDiv = document.createElement("span");
  playerNameDiv.className = "chat-player-name";
  playerNameDiv.textContent = isCurrentPlayer ? "You" : playerId;
  
  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;
  
  messageDiv.appendChild(playerNameDiv);
  messageDiv.appendChild(document.createElement("br"));
  messageDiv.appendChild(messageSpan);
  
  chatMessages.appendChild(messageDiv);
  
  // Auto-scroll to bottom
  chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
}

// Send a chat message
function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) {
    alert("Please enter a message before sending.");
    return;
  }
  
  if (multiplayerClient && multiplayerClient.isConnected) {
    multiplayerClient.sendChat(message);
    displayChatMessage(multiplayerClient.getPlayerId(), message);
  }
  
  chatInput.value = "";
  chatInput.focus();
}

// Clear chat messages
function clearChatMessages() {
  chatMessages.innerHTML = "";
}

// Show bootstrap menu
function showBootstrapMenu() {
  gameMode = "bootstrap-menu";
  menuLoopRunning = false;
  menuContainer.classList.remove("d-none");
  multiplayerMenuContainer.classList.add("d-none");
  gameContainer.classList.add("d-none");
}

// Show multiplayer menu
function showMultiplayerMenu(clearRoom = false) {
  gameMode = "multiplayer-menu";
  menuLoopRunning = false;
  menuContainer.classList.add("d-none");
  multiplayerMenuContainer.classList.remove("d-none");
  gameContainer.classList.add("d-none");
  
  // Only clear room info if explicitly requested (when going back to main menu)
  if (clearRoom) {
    clearRoomInfo();
    isInRoom = false;
  }
  
  roomCodeInput.value = "";
  roomCodeInput.focus();
  updateRoomUI();
}

function showCanvasMenu() {
  gameMode = "canvas-menu";
  menuLoopRunning = true;
  menuContainer.classList.add("d-none");
  multiplayerMenuContainer.classList.add("d-none");
  gameContainer.classList.remove("d-none");
  resetLevelSelection();
  menuLoop();
}

// Show settings menu
function showSettings() {
  gameMode = "settings";
  menuLoopRunning = true;
  menuContainer.classList.add("d-none");
  multiplayerMenuContainer.classList.add("d-none");
  gameContainer.classList.remove("d-none");
  menuLoop();
}

// Handles game and menu key presses
function handleAllKeyPress(e) {
  // ESC from game: go back to appropriate menu
  if (e.key === "Escape" && gameMode === "game") {
    if (isInRoom) {
      // In multiplayer room, return to lobby without leaving
      showMultiplayerMenu(false);
    } else {
      // In singleplayer, go back to chart selection
      if (isMultiplayer && multiplayerClient) {
        multiplayerClient.leaveRoom();
        isMultiplayer = false;
      }
      showCanvasMenu();
    }
    return;
  }
  
  // ESC from canvas menu: go back to appropriate menu
  if (e.key === "Escape" && gameMode === "canvas-menu") {
    if (isMultiplayer) {
      // Coming back from chart selection, stay in room
      showMultiplayerMenu(false);
    } else {
      showBootstrapMenu();
    }
    return;
  }

  // ESC from multiplayer menu: go back to bootstrap menu
  if (e.key === "Escape" && gameMode === "multiplayer-menu") {
    // If in a room, formally leave before going back
    if (isInRoom && multiplayerClient && multiplayerClient.isConnectedToServer()) {
      multiplayerClient.leaveRoom();
      isInRoom = false;
      clearRoomInfo();
      clearChatMessages();
    }
    showBootstrapMenu();
    return;
  }

  // ESC from settings: go back to bootstrap menu
  if (e.key === "Escape" && gameMode === "settings") {
    showBootstrapMenu();
    return;
  }
  
  if (gameMode === "canvas-menu") {
    const selectedLevel = handleMenuKeyPress(e);
    if (selectedLevel) {
      gameMode = "game";
      menuLoopRunning = false;
      currentChartPath = `./charts/${selectedLevel.chart}`;
      startGameWithChart();
    }
  } else if (gameMode === "settings") {
    // Handle scroll speed adjustment (can decrease but won't go below 1.0x)
    const step = 0.1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      let speed = getScrollSpeedMultiplier() - step;
      setScrollSpeedMultiplier(speed);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      let speed = getScrollSpeedMultiplier() + step;
      setScrollSpeedMultiplier(speed);
    }
  } else if (gameMode === "game") {
    handleKeyPress(e);
  }
}

// Starts the game with the currently selected chart
async function startGameWithChart(sendToOthers = true) {
  // If in multiplayer and told to send, notify other players of chart selection
  if (sendToOthers && isMultiplayer && multiplayerClient && multiplayerClient.isConnectedToServer()) {
    multiplayerClient.selectChart(currentChartPath);
  }
  await startGame(currentChartPath, getScrollSpeedMultiplier());
}

// Initialize multiplayer client
async function initializeMultiplayer() {
  // Prevent multiple simultaneous connection attempts
  if (isConnectingToMultiplayer) {
    console.log('Connection already in progress');
    return false;
  }

  // If already connected, don't connect again
  if (multiplayerClient && multiplayerClient.isConnectedToServer()) {
    console.log('Already connected to server');
    return true;
  }

  isConnectingToMultiplayer = true;

  if (!multiplayerClient) {
    multiplayerClient = new MultiplayerClient('ws://localhost:3000');
    window.multiplayerClient = multiplayerClient; // Expose for testing/debugging
    // Setup event listeners
    multiplayerClient.on('roomJoined', (data) => {
      console.log('Room joined successfully:', data);
      const roomId = data.roomId;
      const playerCount = data.players ? data.players.length : 1;
      setRoomInfo(roomId, playerCount);
      isInRoom = true;
      clearChatMessages();
      updateRoomUI();
      showStatusMessage(`Room joined! Code: ${roomId}`, 'success');
    });

    multiplayerClient.on('playerJoined', (data) => {
      console.log('Player joined room:', data);
      if (data.players) {
        updatePlayerCount(data.players.length);
      }
      showStatusMessage(`${data.playerId} joined the room`, 'info');
    });

    multiplayerClient.on('playerLeft', (data) => {
      console.log('Player left room:', data);
      if (data.remainingPlayers) {
        updatePlayerCount(data.remainingPlayers.length);
      }
    });

    multiplayerClient.on('startGame', (data) => {
      console.log('Game starting with chart:', data.chartPath);
      // Start the game with the selected chart
      currentChartPath = data.chartPath;
      

      // Show game container and hide multiplayer menu
      multiplayerMenuContainer.classList.add("d-none");
      gameContainer.classList.remove("d-none");
      gameMode = "game";
      menuLoopRunning = false;
      startGameWithChart(false); // false = don't send chart again, server already did
    });

    multiplayerClient.on('disconnect', () => {
      console.log('Disconnected from server');
      isMultiplayer = false;
      if (gameMode !== "game") {
        showBootstrapMenu();
      }
    });

    multiplayerClient.on('chatMessage', (data) => {
      console.log('Chat message received:', data);
      displayChatMessage(data.playerId, data.message);
    });
  }

  try {
    // Generate a unique player ID
    const playerId = `Player-${Date.now()}`;
    await multiplayerClient.connect(playerId);
    isConnectingToMultiplayer = false;
    return true;

  } catch (error) {
    console.error('Failed to connect to multiplayer:', error);
    showStatusMessage('Failed to connect to server. Server may be offline.', 'danger');
    isConnectingToMultiplayer = false;
    return false;
  }
}

// Handle join room button
joinRoomBtn.addEventListener("click", async () => {
  if (isInRoom) {
    showStatusMessage('You are already in a room. Click "LEAVE ROOM" first.', 'warning');
    return;
  }
  const roomCode = roomCodeInput.value.trim();
  if (!roomCode) {
    showStatusMessage('Please enter a room code', 'warning');
    return;
  }

  // Disable buttons during connection
  joinRoomBtn.disabled = true;
  createRoomBtn.disabled = true;

  const success = await initializeMultiplayer();
  if (success) {
    showStatusMessage('Connecting to room...', 'info');
    multiplayerClient.joinRoom(roomCode);
    isMultiplayer = true;
  }
  // Re-enable buttons
  joinRoomBtn.disabled = false;
  createRoomBtn.disabled = false;
});

// Handle create room button
createRoomBtn.addEventListener("click", async () => {
  if (isInRoom) {
    showStatusMessage('You are already in a room. Click "LEAVE ROOM" first.', 'warning');
    return;
  }
  // Disable buttons during connection
  joinRoomBtn.disabled = true;
  createRoomBtn.disabled = true;

  const success = await initializeMultiplayer();
  if (success) {
    showStatusMessage('Creating new room...', 'info');
    multiplayerClient.joinRoom(); // No roomId = creates new room
    isMultiplayer = true;
  }

  // Re-enable buttons
  joinRoomBtn.disabled = false;
  createRoomBtn.disabled = false;
});

// Handle back to main menu button
backToMainBtn.addEventListener("click", () => {
  if (multiplayerClient && multiplayerClient.isConnectedToServer()) {
    multiplayerClient.disconnect();
  }
  isMultiplayer = false;
  isInRoom = false;
  clearRoomInfo();
  showBootstrapMenu();
});

// Handle leave room button
leaveRoomBtn.addEventListener("click", async () => {
  leaveRoomBtn.disabled = true;
  
  if (multiplayerClient && multiplayerClient.isConnectedToServer()) {
    multiplayerClient.leaveRoom();
  }
  
  isInRoom = false;
  clearRoomInfo();
  clearChatMessages();
  updateRoomUI();
  showStatusMessage('Left the room. You can now join or create a new room.', 'info');
  
  leaveRoomBtn.disabled = false;
});

// Handle start game button
startGameBtn.addEventListener("click", () => {
  showCanvasMenu();
});

// Handle play button click
playBtn.addEventListener("click", () => {
  isMultiplayer = false;
  showCanvasMenu();
});

// Handle multiplayer button click
multiplayerBtn.addEventListener("click", () => {
  showMultiplayerMenu(true);
});

// Handle settings button click
if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    showSettings();
  });
}

// Handle send chat button
sendChatBtn.addEventListener("click", () => {
  sendChatMessage();
});

// Handle chat input enter key
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendChatMessage();
  }
});

// Initialize
document.addEventListener("keydown", handleAllKeyPress);
initializeGame();
showBootstrapMenu();