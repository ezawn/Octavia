import { handleKeyPress } from "./inputHandler.js";
import { loadLevels, drawMenu, handleMenuKeyPress, resetLevelSelection, setRoomInfo, updatePlayerCount, showStatusMessage, clearRoomInfo } from "./menu.js";
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
const roomCodeInput = document.getElementById("roomCodeInput");

let gameMode = "bootstrap-menu"; // bootstrap-menu, multiplayer-menu, canvas-menu, or game
let currentChartPath = null;
let menuLoopRunning = false;
let multiplayerClient = null;
let isMultiplayer = false;
let isConnectingToMultiplayer = false;

async function initializeGame() {
  await loadLevels();
  resetLevelSelection();
}

// Canvas-based menu loop (used when coming from bootstrap menu)
function menuLoop() {
  if (!menuLoopRunning) return;
  
  drawMenu(ctx, canvas);
  requestAnimationFrame(menuLoop);
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
function showMultiplayerMenu() {
  gameMode = "multiplayer-menu";
  menuLoopRunning = false;
  menuContainer.classList.add("d-none");
  multiplayerMenuContainer.classList.remove("d-none");
  gameContainer.classList.add("d-none");
  clearRoomInfo();
  roomCodeInput.value = "";
  roomCodeInput.focus();
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

// Handles game and menu key presses
function handleAllKeyPress(e) {
  // ESC from game: go back to canvas menu
  if (e.key === "Escape" && gameMode === "game") {
    if (isMultiplayer && multiplayerClient) {
      multiplayerClient.leaveRoom();
      isMultiplayer = false;
    }
    showCanvasMenu();
    return;
  }
  
  // ESC from canvas menu: go back to appropriate menu
  if (e.key === "Escape" && gameMode === "canvas-menu") {
    if (isMultiplayer) {
      showMultiplayerMenu();
    } else {
      showBootstrapMenu();
    }
    return;
  }

  // ESC from multiplayer menu: go back to bootstrap menu
  if (e.key === "Escape" && gameMode === "multiplayer-menu") {
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
  } else if (gameMode === "game") {
    handleKeyPress(e);
  }
}

// Starts the game with the currently selected chart
async function startGameWithChart() {
  await startGame(currentChartPath);
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
    
    // Setup event listeners
    multiplayerClient.on('roomJoined', (data) => {
      console.log('Room joined successfully:', data);
      const roomId = data.roomId;
      const playerCount = data.players ? data.players.length : 1;
      setRoomInfo(roomId, playerCount);
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
      gameMode = "game";
      startGameWithChart();
    });

    multiplayerClient.on('disconnect', () => {
      console.log('Disconnected from server');
      isMultiplayer = false;
      if (gameMode !== "game") {
        showBootstrapMenu();
      }
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
  clearRoomInfo();
  showBootstrapMenu();
});

// Handle play button click
playBtn.addEventListener("click", () => {
  isMultiplayer = false;
  showCanvasMenu();
});

// Handle multiplayer button click
multiplayerBtn.addEventListener("click", () => {
  showMultiplayerMenu();
});

// Initialize
document.addEventListener("keydown", handleAllKeyPress);
initializeGame();
showBootstrapMenu();