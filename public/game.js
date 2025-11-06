import { GAME_SETTINGS, COLORS } from './constants.js';
import { NoteManager } from './noteManager.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputHandler.js';

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.score = 0;
        
        this.noteManager = new NoteManager();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.inputHandler = new InputHandler(this.noteManager, () => this.onHit());
        
        this.gameLoop = this.gameLoop.bind(this);
    }

    onHit() {
        this.score += GAME_SETTINGS.SCORE_PER_HIT;
    }

    update() {
        const now = Date.now();
        if (now - this.noteManager.lastSpawn > GAME_SETTINGS.SPAWN_INTERVAL) {
            this.noteManager.spawnNote();
            this.noteManager.lastSpawn = now;
        }

        this.noteManager.updateNotes(GAME_SETTINGS.NOTE_SPEED, this.canvas.height);
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawHitLine(COLORS.HIT_LINE, GAME_SETTINGS.HIT_LINE);
        this.renderer.drawNotes(this.noteManager.notes, COLORS.NOTE, GAME_SETTINGS.NOTE_RADIUS);
        this.renderer.drawScore(this.score, COLORS.SCORE);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    start() {
        this.gameLoop();
    }
}

const game = new Game();
game.start();
