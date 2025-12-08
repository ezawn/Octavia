import { handleKeyPress } from "./inputHandler.js";
import { loadLevels, drawMenu, handleMenuKeyPress, resetLevelSelection } from "./menu.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menuContainer = document.getElementById("menuContainer");
const gameContainer = document.getElementById("gameContainer");
const playBtn = document.getElementById("playBtn");

let gameMode = "bootstrap-menu";//bootstrap-menu, canvas-menu, or game
let currentChartPath = null;
let menuLoopRunning = false;

async function initializeGame() {
  await loadLevels();
  resetLevelSelection();
}

//Canvas-based menu loop (used when coming from bootstrap menu)
function menuLoop() {
  if (!menuLoopRunning) return;
  
  drawMenu(ctx, canvas);
  requestAnimationFrame(menuLoop);
}

//Show bootstrap menu
function showBootstrapMenu() {
  gameMode = "bootstrap-menu";
  menuLoopRunning = false;
  menuContainer.classList.remove("d-none");
  gameContainer.classList.add("d-none");
}


function showCanvasMenu() {
  gameMode = "canvas-menu";
  menuLoopRunning = true;
  menuContainer.classList.add("d-none");
  gameContainer.classList.remove("d-none");
  resetLevelSelection();
  menuLoop();
}

//Handles game and menu key presses
function handleAllKeyPress(e) {
  //ESC from game: go back to canvas menu
  if (e.key === "Escape" && gameMode === "game") {
    showCanvasMenu();
    return;
  }
  
  //ESC from canvas menu: go back to bootstrap menu
  if (e.key === "Escape" && gameMode === "canvas-menu") {
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

//starts the game with the currently selected chart
async function startGameWithChart() {
  await startGame(currentChartPath);
}

//Handle play button click
playBtn.addEventListener("click", () => {
  showCanvasMenu();
});

//Initialize
document.addEventListener("keydown", handleAllKeyPress);
initializeGame();
showBootstrapMenu();