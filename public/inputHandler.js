import { HIT_LINE, HIT_THRESHOLD, LANES, NOTE_SPEED } from "./constants.js";
import { checkHit, counterIncrease } from "./noteManager.js";
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

  const gameState = getGameState();
  // Don't accept hits after the chart ends or if game is over
  if (gameState.levelComplete || gameState.gameOver) return;

  const lane = KEY_TO_LANE[e.code];
  const laneX = LANES[lane];
  const { notes } = gameState;
  const result = checkHit(notes, HIT_LINE, HIT_THRESHOLD, laneX, NOTE_SPEED);
/*On hit, if the judgement is not a miss, update the game state with the new notes and judgement.
If miss or hit when note is out of range, reduce health and reset combo.*/
  if (result.hit && result.judgment !== JUDGEMENTS.MISS) {
    counterIncrease(result.judgment);
    updateGameState(result.notes, result.judgment);
  } else if (result.hit && result.judgment === JUDGEMENTS.MISS) { //Note removed and judged as MISS
    counterIncrease(JUDGEMENTS.MISS);
    updateGameState(result.notes, JUDGEMENTS.MISS);
    damageHealth(5);
  } else {
    counterIncrease(JUDGEMENTS.MISS);
    updateGameState(result.notes, JUDGEMENTS.MISS);
    damageHealth(5);
  }
}   