import { 
    NOTE_SPEED, 
    HIT_LINE, 
    SPAWN_INTERVAL, 
    NOTE_RADIUS,
    SCORE_PER_HIT, 
    COLORS 
} from './constants.js';
import { spawnNote, updateNotes } from './noteManager.js';
import { clear, drawHitLine, drawNotes, drawScore } from './renderer.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
    notes: [],
    score: 0,
    lastSpawn: 0
};

export function getGameState() {
    return gameState;
}

export function updateGameState(newNotes) {
    gameState.notes = newNotes;
    gameState.score += SCORE_PER_HIT;
}

function update() {
    const now = Date.now();
    if (now - gameState.lastSpawn > SPAWN_INTERVAL) {
        gameState.notes = spawnNote(gameState.notes);
        gameState.lastSpawn = now;
    }

    gameState.notes = updateNotes(gameState.notes, NOTE_SPEED, canvas.height);
}

function draw() {
    clear(ctx, canvas);
    drawHitLine(ctx, canvas, COLORS.HIT_LINE, HIT_LINE);
    drawNotes(ctx, gameState.notes, COLORS.NOTE, NOTE_RADIUS);
    drawScore(ctx, gameState.score, COLORS.SCORE);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

export function startGame() {
    gameLoop();
}
