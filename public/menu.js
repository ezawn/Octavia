import { COLOURS } from "./constants.js";

let levels = [];
let selectedLevelIndex = 0;
let scrollSpeedMultiplier = 1.0; // Current scroll speed (1.0x to 6.0x)

export async function loadLevels() {
  const response = await fetch("./levels.json");
  const data = await response.json();
  levels = data.levels;
  return levels;
}

export function loadSettings() {
  const savedSpeed = localStorage.getItem('scrollSpeed');
  if (savedSpeed) {
    scrollSpeedMultiplier = parseFloat(savedSpeed);
  }
}

export function drawMenu(ctx, canvas) {
  //Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //Title
  ctx.fillStyle = "white";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("OCTAVIA", canvas.width / 2, 80);

  //Subtitle
  ctx.font = "24px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("Select a Level", canvas.width / 2, 130);

  //Draw level buttons
  const levelList = levels || [];
  const buttonWidth = 300;
  const buttonHeight = 80;
  const buttonSpacing = 120;
  const maxVisibleButtons = 3;
  const viewportHeight = buttonSpacing * maxVisibleButtons;
  const startY = 200;
  
  //Calculate scroll offset, required if more levels than visible buttons
  const scrollOffset = Math.max(0, selectedLevelIndex - maxVisibleButtons + 1) * buttonSpacing;

  //Draw only visible buttons
  levelList.forEach((level, index) => {
    const y = startY + index * buttonSpacing - scrollOffset;
    const x = canvas.width / 2 - buttonWidth / 2;
    
    //Draw if visible
    if (y + buttonHeight < startY || y > startY + viewportHeight) {
      return;
    }

    //Button background
    const isSelected = index === selectedLevelIndex;
    ctx.fillStyle = isSelected ? "#00ffff" : "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(x, y, buttonWidth, buttonHeight);

    //Button border
    ctx.strokeStyle = isSelected ? "#00ffff" : "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, buttonWidth, buttonHeight);

    //Button text
    ctx.fillStyle = isSelected ? "#000" : "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(level.name, canvas.width / 2, y + 30);

    ctx.font = "14px Arial";
    ctx.fillStyle = isSelected ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.6)";
    ctx.fillText(level.description, canvas.width / 2, y + 55);
  });

  //Display instructions
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "center";
  ctx.fillText("Press UP/DOWN to select, ENTER to start", canvas.width / 2, canvas.height - 40);
  
  //Show scroll indicator if there are more levels
  if (levelList.length > maxVisibleButtons) {
    ctx.font = "12px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    if (selectedLevelIndex > 0) {
      ctx.fillText("^ More levels above", canvas.width / 2, startY - 10);
    }
    if (selectedLevelIndex < levelList.length - 1) {
      ctx.fillText("v More levels below", canvas.width / 2, startY + viewportHeight + 20);
    }
  }
}
//Handles key presses in the menu for level selection
export function handleMenuKeyPress(e) {
  const levelList = levels || [];
  if (levelList.length === 0) return null; //No levels loaded, ignore input, prevents errors
  if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedLevelIndex = (selectedLevelIndex - 1 + levelList.length) % levelList.length; //Goes back one in the list, wraps to end if at start
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedLevelIndex = (selectedLevelIndex + 1) % levelList.length; //Goes forward one in the list, wraps to start if at end
  } else if (e.key === "Enter") {
    e.preventDefault();
    return levelList[selectedLevelIndex];
  }
  return null;
}
//Returns selected level
export function getSelectedLevel() {
  return levels ? levels[selectedLevelIndex] : null;
}
//Sets level selection to first lvl
export function resetLevelSelection() {
  selectedLevelIndex = 0;
}

/**
 * Multiplayer menu management
 */
let currentRoomId = null;
let playersInRoom = 0;

export function setRoomInfo(roomId, playerCount) {
  currentRoomId = roomId;
  playersInRoom = playerCount;
  updateRoomDisplay();
}

export function updatePlayerCount(count) {
  playersInRoom = count;
  updateRoomDisplay();
}

function updateRoomDisplay() {
  const roomInfoContainer = document.getElementById('roomInfoContainer');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const playerCountDisplay = document.getElementById('playerCountDisplay');
  
  if (currentRoomId) {
    roomInfoContainer.classList.remove('d-none');
    roomCodeDisplay.textContent = currentRoomId;
    playerCountDisplay.textContent = playersInRoom;
  }
}

export function showStatusMessage(message, type = 'info') {
  const statusMessage = document.getElementById('roomStatusMessage');
  statusMessage.textContent = message;
  statusMessage.className = `alert alert-${type}`;
  statusMessage.classList.remove('d-none');
}

export function hideStatusMessage() {
  const statusMessage = document.getElementById('roomStatusMessage');
  statusMessage.classList.add('d-none');
}

export function clearRoomInfo() {
  currentRoomId = null;
  playersInRoom = 0;
  const roomInfoContainer = document.getElementById('roomInfoContainer');
  roomInfoContainer.classList.add('d-none');
  hideStatusMessage();
}

// Scroll speed functions
export function getScrollSpeedMultiplier() {
  return scrollSpeedMultiplier;
}

export function setScrollSpeedMultiplier(speed) {
  scrollSpeedMultiplier = Math.max(1.0, Math.min(6.0, speed));
  localStorage.setItem('scrollSpeed', scrollSpeedMultiplier);
}

export function drawSettingsMenu(ctx, canvas) {
  // Background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = "white";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SETTINGS", canvas.width / 2, 80);

  // Settings section
  ctx.font = "24px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.textAlign = "center";
  ctx.fillText("Scroll Speed", canvas.width / 2, 180);

  // Display current speed
  ctx.font = "36px Arial";
  ctx.fillStyle = "#00FFFF";
  ctx.fillText(scrollSpeedMultiplier.toFixed(2) + "x", canvas.width / 2, 250);

  // Speed buttons / slider representation
  ctx.font = "16px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.textAlign = "center";
  ctx.fillText("Press LEFT/RIGHT to adjust (1.0x - 6.0x)", canvas.width / 2, 310);

  // Show speed range
  const barWidth = 400;
  const barHeight = 30;
  const barX = canvas.width / 2 - barWidth / 2;
  const barY = 360;

  // Draw speed bar background
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Draw filled portion
  const fillPercent = (scrollSpeedMultiplier - 1.0) / 5.0; // 1.0 to 6.0 range
  ctx.fillStyle = "#00FFFF";
  ctx.fillRect(barX, barY, barWidth * fillPercent, barHeight);

  // Draw border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Labels
  ctx.font = "12px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.textAlign = "left";
  ctx.fillText("1.0x", barX - 30, barY + 20);
  ctx.textAlign = "right";
  ctx.fillText("6.0x", barX + barWidth + 30, barY + 20);

  // Instructions
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.textAlign = "center";
  ctx.fillText("Press ESC to go back", canvas.width / 2, canvas.height - 30);
}
