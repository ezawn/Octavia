import { COLOURS } from './constants.js';

let levels = [];
let selectedLevelIndex = 0;

export async function loadLevels() {
  const response = await fetch('./levels.json');
  const data = await response.json();
  levels = data.levels;
  return levels;
}

export function drawMenu(ctx, canvas) {
  // Background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('OCTAVIA', canvas.width / 2, 80);

  // Subtitle
  ctx.font = '24px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Select a Level', canvas.width / 2, 130);

  // Draw level buttons
  const levelList = levels || [];
  const buttonWidth = 300;
  const buttonHeight = 80;
  const buttonSpacing = 120;
  const startY = 200;

  levelList.forEach((level, index) => {
    const y = startY + index * buttonSpacing;
    const x = canvas.width / 2 - buttonWidth / 2;

    // Button background
    const isSelected = index === selectedLevelIndex;
    ctx.fillStyle = isSelected ? '#00ffff' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, buttonWidth, buttonHeight);

    // Button border
    ctx.strokeStyle = isSelected ? '#00ffff' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, buttonWidth, buttonHeight);

    // Button text
    ctx.fillStyle = isSelected ? '#000' : 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(level.name, canvas.width / 2, y + 30);

    ctx.font = '14px Arial';
    ctx.fillStyle = isSelected ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(level.description, canvas.width / 2, y + 55);
  });

  // Instructions
  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('Press UP/DOWN to select, ENTER to start', canvas.width / 2, canvas.height - 40);
}

export function handleMenuKeyPress(e) {
  const levelList = levels || [];

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedLevelIndex = (selectedLevelIndex - 1 + levelList.length) % levelList.length; //Goes back one in the list, wraps to end if at start
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedLevelIndex = (selectedLevelIndex + 1) % levelList.length; //Goes forward one in the list, wraps to start if at end
  } else if (e.key === 'Enter') {
    e.preventDefault();
    return levelList[selectedLevelIndex];
  }
  return null;
}

export function getSelectedLevel() {
  return levels ? levels[selectedLevelIndex] : null;
}

export function resetLevelSelection() {
  selectedLevelIndex = 0;
}
