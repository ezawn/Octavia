import { HIT_LINE, HIT_THRESHOLD } from './constants.js';
import { checkHit } from './noteManager.js';
import { getGameState, updateGameState } from './game.js';

export function handleKeyPress(e) {
    if (e.code === "Space") {
        const { notes } = getGameState();
        const result = checkHit(notes, HIT_LINE, HIT_THRESHOLD);
        if (result.hit) {
            updateGameState(result.notes);
            if (hit) {
                this.onHit();
            }
        }
    }
}