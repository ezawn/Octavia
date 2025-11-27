import { handleKeyPress } from './inputHandler.js';
import { startGame, isGameOver } from './game.js';
import { loadLevels, drawMenu, handleMenuKeyPress, resetLevelSelection } from './menu.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameMode = 'menu'; // Either menu or game
let currentChartPath = null;
let menuLoopRunning = true;

async function initializeMenu() {
  await loadLevels();
  resetLevelSelection();
  menuLoop();
}
// main menu loop, keeps drawing the menu until a level is selected
function menuLoop() {
  if (!menuLoopRunning) return;
  
  drawMenu(ctx, canvas);
  requestAnimationFrame(menuLoop);
}
// handles all key presses, routing them to the menu or game as appropriate
function handleAllKeyPress(e) {
  if (e.key === 'Escape' && gameMode === 'game') {
    gameMode = 'menu';
    menuLoopRunning = true;
    resetLevelSelection();
    menuLoop();
    return;
  }
  
  if (gameMode === 'menu') {
    const selectedLevel = handleMenuKeyPress(e);
    if (selectedLevel) {
      gameMode = 'game';
      menuLoopRunning = false;
      currentChartPath = `./charts/${selectedLevel.chart}`;
      startGameWithChart();
    }
  } else if (gameMode === 'game') {
    handleKeyPress(e);
  }
}
// starts the game with the currently selected chart
async function startGameWithChart() {
  await startGame(currentChartPath);
}

// Initialize
document.addEventListener('keydown', handleAllKeyPress);
initializeMenu();