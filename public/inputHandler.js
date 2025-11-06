import { GAME_SETTINGS } from './constants.js';

export class InputHandler {
    constructor(noteManager, onHit) {
        this.noteManager = noteManager;
        this.onHit = onHit;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener("keydown", (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        if (e.code === "Space") {
            const hit = this.noteManager.checkHit(
                GAME_SETTINGS.HIT_LINE,
                GAME_SETTINGS.HIT_THRESHOLD
            );
            if (hit) {
                this.onHit();
            }
        }
    }
}