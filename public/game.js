import { NOTE_SPEED, HIT_LINE, NOTE_RADIUS, MAX_HEALTH, HEALTH_DAMAGE_PER_MISS, COLOURS } from "./constants.js";
import { spawnNote, updateNotes, loadChart, resetChart, isChartFinished } from "./noteManager.js";
import { clear, drawLanes, drawHitLine, drawNotes, drawScore, drawHealth, drawCombo, drawGameOver, drawJudgment, drawLevelComplete } from "./renderer.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
  notes: [],
  score: 0,
  health: MAX_HEALTH,
  lastSpawn: 0,
  gameOver: false,
  levelComplete: false,
  currentCombo: 0,
  maxCombo: 0,
};

let gameLoopRunning = false;

export function getGameState() {
  return gameState;
}

export function isGameOver() {
  return gameState.gameOver;
}

export function isLevelComplete() {
  return gameState.levelComplete;
}


export function updateGameState(newNotes, judgment = null) {
  gameState.notes = newNotes;
  if (judgment) {
    if (judgment.label !== 'MISS') {
      gameState.currentCombo += 1;
    } else {
      gameState.currentCombo = 0;
    }
    if (gameState.currentCombo > gameState.maxCombo) {
      gameState.maxCombo = gameState.currentCombo;
    }
    gameState.score += judgment.score;
    gameState.lastJudgment = judgment;
    gameState.judgmentDisplayTime = Date.now();
  }
}

export function damageHealth(damage) {
  gameState.health -= damage;
  if (gameState.health <= 0) {
    gameState.health = 0;
    gameState.gameOver = true;
  }
}

function update() {
  // Spawn note based on chart timing
  const beforeSpawn = gameState.notes.length;
  gameState.notes = spawnNote(gameState.notes);
  const afterSpawn = gameState.notes.length;
  
  const previousNotes = gameState.notes;
  gameState.notes = updateNotes(gameState.notes, NOTE_SPEED, canvas.height);

  const missedNotes = previousNotes.filter(note => {
    const isPastHitLine = note.y > HIT_LINE;
    const stillExists = gameState.notes.some(n => n === note);
    return isPastHitLine && !stillExists;
  });

  if (missedNotes.length > 0) {
    damageHealth(HEALTH_DAMAGE_PER_MISS * missedNotes.length);
    gameState.currentCombo = 0; // Reset combo on missed notes
  }
  
  // Check if level is complete: chart finished spawning and no notes on screen
  if (!gameState.levelComplete && isChartFinished() && gameState.notes.length === 0) {
    gameState.levelComplete = true;
  }
}

function draw() {
  clear(ctx, canvas);
  drawLanes(ctx, canvas, HIT_LINE);
  drawHitLine(ctx, canvas, COLOURS.HIT_LINE, HIT_LINE);
  drawNotes(ctx, gameState.notes, COLOURS.NOTE, NOTE_RADIUS);
  drawScore(ctx, gameState.score, COLOURS.SCORE, canvas);
  drawHealth(ctx, gameState.health, MAX_HEALTH, COLOURS.HEALTH, canvas);
  drawCombo(ctx, gameState.currentCombo, COLOURS.NOTE, canvas);
  drawJudgment(ctx, canvas, gameState.lastJudgment, gameState.judgmentDisplayTime);
  
  if (gameState.levelComplete && !gameState.gameOver) {
    drawLevelComplete(ctx, canvas, gameState.score);
  } else if (gameState.gameOver) {
    drawGameOver(ctx, canvas, gameState.score);
  }
}
//
function clearNotes(gameState) {
  if (gameState.gameOver) 
  gameState.notes = [];
}
function gameLoop() {
  if (!gameLoopRunning) return;
  
  update();
  draw();
  requestAnimationFrame(gameLoop);
  clearNotes(gameState);
}
export function resetGameState() {
  gameState = {
    notes: [],
    score: 0,
    health: MAX_HEALTH,
    lastSpawn: 0,
    gameOver: false,
    levelComplete: false,
    currentCombo: 0,
    lastJudgment: null,
    judgmentDisplayTime: 0,
  };
  gameLoopRunning = false;
}
// start the game with the specified chart path
export async function startGame(chartPath) {
  resetGameState();
  await loadChart(chartPath);
  resetChart();
  gameLoopRunning = true;
  gameLoop();
}
