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
/*Handles key press events for hitting notes in the game
Maps key presses to lanes and checks for hits
Updates game state based on hit results*/
export function handleKeyPress(e) {
  if (!(e.code in KEY_TO_LANE)) return;

  const lane = KEY_TO_LANE[e.code];
  const laneX = LANES[lane];
  const { notes } = getGameState();
  const result = checkHit(notes, HIT_LINE, HIT_THRESHOLD, laneX, NOTE_SPEED);
/*On hit, if the judgement is not a miss, update the game state with the new notes and judgement.
If miss or hit when note is out of range, reduce health by 5.*/
  if (result.hit && result.judgment !== JUDGEMENTS.MISS) {
    updateGameState(result.notes, result.judgment);
  } else {
    damageHealth(5);
  }
}   