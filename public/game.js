import { NOTE_SPEED, HIT_LINE, NOTE_RADIUS, SCORE_PER_HIT, MAX_HEALTH, HEALTH_DAMAGE_PER_MISS, COLOURS } from "./constants.js";
import { spawnNote, updateNotes, loadChart, resetChart } from "./noteManager.js";
import { clear, drawLanes, drawHitLine, drawNotes, drawScore, drawHealth, drawGameOver } from "./renderer.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
  notes: [],
  score: 0,
  health: MAX_HEALTH,
  lastSpawn: 0,
  gameOver: false,
};

let gameLoopRunning = false;

export function getGameState() {
  return gameState;
}


export function updateGameState(newNotes) {
  gameState.notes = newNotes;
  gameState.score += SCORE_PER_HIT;
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
  gameState.notes = spawnNote(gameState.notes);

  const previousNotes = gameState.notes;
  gameState.notes = updateNotes(gameState.notes, NOTE_SPEED, canvas.height);

  const missedNotes = previousNotes.filter(note => {
    const isPastHitLine = note.y > HIT_LINE;
    const stillExists = gameState.notes.some(n => n === note);
    return isPastHitLine && !stillExists;
  });

  if (missedNotes.length > 0) {
    damageHealth(HEALTH_DAMAGE_PER_MISS * missedNotes.length);
  }
}

function draw() {
  clear(ctx, canvas);
  drawLanes(ctx, canvas, HIT_LINE);
  drawHitLine(ctx, canvas, COLOURS.HIT_LINE, HIT_LINE);
  drawNotes(ctx, gameState.notes, COLOURS.NOTE, NOTE_RADIUS);
  drawScore(ctx, gameState.score, COLOURS.SCORE, canvas);
  drawHealth(ctx, gameState.health, MAX_HEALTH, COLOURS.HEALTH, canvas);
  
  if (gameState.gameOver) {
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
// self explanatory
export function resetGameState() {
  gameState = {
    notes: [],
    score: 0,
    health: MAX_HEALTH,
    lastSpawn: 0,
    gameOver: false,
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
