import { HIT_LINE, HIT_THRESHOLD, LANES, NOTE_SPEED } from "./constants.js";
import { checkHit } from "./noteManager.js";
import { getGameState, updateGameState, damageHealth } from "./game.js";
import { JUDGEMENTS } from "./constants.js";

const KEY_TO_LANE = {
  KeyD: 0,
  KeyF: 1,
  KeyJ: 2,
  KeyK: 3,
};

export function handleKeyPress(e) {
  if (!(e.code in KEY_TO_LANE)) return;

  const lane = KEY_TO_LANE[e.code];
  const laneX = LANES[lane];
  const { notes } = getGameState();
  const result = checkHit(notes, HIT_LINE, HIT_THRESHOLD, laneX, NOTE_SPEED);

  if (result.hit) {
    updateGameState(result.notes, result.judgment);
    // Don't damage health on hit
  } else {
    damageHealth(5);
  }
}   