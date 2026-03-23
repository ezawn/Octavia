import { LANES } from "./constants.js";
import { checkHit, counterIncrease, hasFirstNotePassedHitLine } from "./noteManager.js";
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
  //disable inputs on chart end
  if (gameState.levelComplete || gameState.gameOver) return;

  const lane = KEY_TO_LANE[e.code];
  const laneX = LANES[lane];
  const { notes } = gameState;
  const result = checkHit(notes, laneX);
/*On hit, if the judgement is not a miss, update the game state with the new notes and judgement.
If miss or hit when note is out of range, reduce health and reset combo but only if the first note has already been judged
*/
  if (result.hit && result.judgment !== JUDGEMENTS.MISS) {
    counterIncrease(result.judgment);
    updateGameState(result.notes, result.judgment);
  } else if (result.hit && result.judgment === JUDGEMENTS.MISS) { //judge as miss
    counterIncrease(JUDGEMENTS.MISS);
    updateGameState(result.notes, JUDGEMENTS.MISS);
    damageHealth(5);
  } else if (hasFirstNotePassedHitLine()) {
    //Dont consider a miss if the first note hasnt passed the hitline/been hit
    counterIncrease(JUDGEMENTS.MISS);
    updateGameState(result.notes, JUDGEMENTS.MISS);
    damageHealth(5);
  }
}   
