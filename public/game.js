import {  NOTE_SPEED,  HIT_LINE,  SPAWN_INTERVAL,  NOTE_RADIUS,  SCORE_PER_HIT,  MAX_HEALTH,  HEALTH_DAMAGE_PER_MISS,  COLOURS,} from "./constants.js";
import { spawnNote, updateNotes } from "./noteManager.js";
import {  clear,  drawLanes,  drawHitLine,  drawNotes,  drawScore,  drawHealth,  drawGameOver,} from "./renderer.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
  notes: [],
  score: 0,
  health: MAX_HEALTH,
  lastSpawn: 0,
  gameOver: false,
};
window.gameState = gameState;
export function getGameState() {
  return gameState;
}
//Increases  score and pushes it to the game state object
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
/* Update is called every frame
Spawn note if sufficient time has elapsed
Returns True if it is past the hit line and it doesn't exist
Reduces health by DAMAGE_PER_MISS * length of missedNotes*/
function update() {
  const now = Date.now();
  if (now - gameState.lastSpawn > SPAWN_INTERVAL) {
    gameState.notes = spawnNote(gameState.notes);
    gameState.lastSpawn = now;
  }

  const previousNotes = gameState.notes;
  gameState.notes = updateNotes(gameState.notes, NOTE_SPEED, canvas.height);


  const missedNotes = previousNotes.filter((note) => {
    const isPastHitLine = note.y > HIT_LINE;
    const stillExists = gameState.notes.some((n) => n === note);
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


function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}


export function startGame() {
  gameLoop();
}
