import { NOTE_SPEED, HIT_LINE, NOTE_RADIUS, MAX_HEALTH, HEALTH_DAMAGE_PER_MISS, COLOURS, MAX_SCORE, JUDGEMENTS } from "./constants.js";
import { spawnNote, updateNotes, loadChart, resetChart, isChartFinished, getChartNoteCount, counterIncrease } from "./noteManager.js";
import { clear, drawLanes, drawHitLine, drawNotes, drawScore, drawHealth, drawCombo, drawGameOver, drawJudgment, drawLevelComplete, drawAccuracy } from "./renderer.js";
import { getJudgementCounter } from "./noteManager.js";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
  notes: [],
  score: 0,
  health: MAX_HEALTH,
  lastSpawn: 0,
  gameOver: false,
  levelComplete: false,
  currentCombo: 0,
  maxCombo: 0,
  noteCount: 0,
  maxRawScore: 0,
  accuracy: 0,
};
window.gameState=gameState;
let gameLoopRunning = false;

export function getGameState() {
  return gameState;
}

export function isGameOver() {
  return gameState.gameOver;
}

export function isLevelComplete() {
  return gameState.levelComplete;
}

/*Everytime a note is hit, update gameState
Handle score calculations, combos and judgements*/
export function updateGameState(newNotes, judgment = null) {
  gameState.notes = newNotes;
  if (judgment) {
    if (judgment.label !== "MISS") {
      gameState.currentCombo += 1;
    } else {
      gameState.currentCombo = 0;
    }
    if (gameState.currentCombo > gameState.maxCombo) {
      gameState.maxCombo = gameState.currentCombo;
    }
    
    /*Calculate score based on judgment, current combo, and max raw score*/
    if (gameState.noteCount > 0 && gameState.maxRawScore > 0) {
      const noteScore = calculateNoteScore(judgment.baseScore, gameState.currentCombo, gameState.noteCount);
      const finalScore = calculateScoreContribution(noteScore, gameState.maxRawScore);
      gameState.score += Math.round(finalScore);//Round only at the end
      //Score is capped to 1m to prevent it going over
      if (gameState.score > MAX_SCORE) {
        gameState.score = MAX_SCORE;
      }
    } else {
      //Fallback if calcs can't be done - potential edge case?
      gameState.score += judgment.baseScore;
    }
    
    gameState.lastJudgment = judgment;
    gameState.judgmentDisplayTime = Date.now();
  }
}

export function damageHealth(damage) {
  gameState.health -= damage;
  if (gameState.health <= 0) {
    gameState.health = 0;
    gameState.gameOver = true;
    gameState.accuracy = accuracyCalculation();
  }
}

//Calculates the score for a single note based on base score, combo and max combo 
export function calculateNoteScore(baseScore, currentCombo, maxCombo) {
  if (maxCombo === 0) return baseScore;
  const comboRatio = currentCombo / maxCombo;
  return baseScore * (1 + comboRatio);//Dont round, return float so score = exactly 1m
}

/*Calculates the maximum raw score achievable with perfect hits on all notes
Assumes all notes are hit with "GREAT"*/
export function calculateMaxRawScore(noteCount) {
  let maxScore = 0;
  const greatbaseScore = 300;//Assuming all perfect hits are GREAT
  
  for (let i = 1; i <= noteCount; i++) {
    //At full combo, each note sees the maximum combo ratio (i / noteCount)
    maxScore += calculateNoteScore(greatbaseScore, i, noteCount);//Accumulate floats
  }
  
  return maxScore;//Return float
}

//Calculates the score contribution of a note towards the final score based on max raw score
export function calculateScoreContribution(noteScore, maxRawScore) {
  if (maxRawScore === 0) return 0;
  return noteScore * (MAX_SCORE / maxRawScore); //Returns a float instead of rounding down
}
/*Updates the game state each frame
Spawns notes, updates the already existing notes, checks for missed notes*/
function update() {
  //Spawns note by reading the chart json file
  gameState.notes = spawnNote(gameState.notes);
  const previousNotes = gameState.notes;
  gameState.notes = updateNotes(gameState.notes, NOTE_SPEED, canvas.height);

  const missedNotes = previousNotes.filter(note => { //Creates array of missed notes
    const isPastHitLine = note.y > HIT_LINE;
    const stillExists = gameState.notes.some(n => n === note);
    return isPastHitLine && !stillExists;
  });

  if (missedNotes.length > 0) {
    missedNotes.forEach(() => counterIncrease(JUDGEMENTS.MISS));
    damageHealth(HEALTH_DAMAGE_PER_MISS * missedNotes.length);
    gameState.currentCombo = 0;//Reset combo on missed notes
  }
  
  // Update accuracy every frame
  gameState.accuracy = accuracyCalculation();
  
  //Confirms level is complete
  if (!gameState.levelComplete && isChartFinished() && gameState.notes.length === 0) {
    gameState.levelComplete = true;
  }
}
/*Draws the game state each frame
Draws notes, lanes etc*/
function draw() {
  clear(ctx, canvas);
  drawLanes(ctx, canvas, HIT_LINE);
  drawHitLine(ctx, canvas, COLOURS.HIT_LINE, HIT_LINE);
  drawNotes(ctx, gameState.notes, COLOURS.NOTE, NOTE_RADIUS);
  drawScore(ctx, gameState.score, COLOURS.SCORE, canvas);
  drawHealth(ctx, gameState.health, MAX_HEALTH, COLOURS.HEALTH, canvas);
  drawCombo(ctx, gameState.currentCombo, COLOURS.NOTE, canvas);
  drawJudgment(ctx, canvas, gameState.lastJudgment, gameState.judgmentDisplayTime);
  drawAccuracy(ctx, canvas, gameState.accuracy);
  
  if (gameState.levelComplete && !gameState.gameOver) {
    drawLevelComplete(ctx, canvas, gameState.score);
  } else if (gameState.gameOver) {
    drawGameOver(ctx, canvas, gameState.score);
  }
}
//Removes notes when gameOver is true
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
//When new chart is loaded, reset game data
export function resetGameState() {
  gameState.notes = [];
  gameState.score = 0;
  gameState.health = MAX_HEALTH;
  gameState.lastSpawn = 0;
  gameState.gameOver = false;
  gameState.levelComplete = false;
  gameState.currentCombo = 0;
  gameState.maxCombo = 0;
  gameState.noteCount = 0;
  gameState.maxRawScore = 0;
  gameState.lastJudgment = null;
  gameState.judgmentDisplayTime = 0;
  gameState.accuracy = 0;
  gameLoopRunning = false;
}
//Starts the game with the chart that the player selects
export async function startGame(chartPath) {
  resetGameState();
  await loadChart(chartPath);
  resetChart();
  
  //Total notes, maximum raw score before normalization
  gameState.noteCount = getChartNoteCount();
  gameState.maxRawScore = calculateMaxRawScore(gameState.noteCount);
  
  gameLoopRunning = true;
  gameLoop();
}
/*Calculates accuracy of player at that point in time
Copied formula from osu!mania for accuracy calculation*/
export function accuracyCalculation() {
  const judgementCounter = getJudgementCounter();
  const numerator=300*(judgementCounter.GREAT)+200*judgementCounter.GOOD+100*judgementCounter.OK+50*judgementCounter.MEH
  const denominator=300*(judgementCounter.GREAT+judgementCounter.GOOD+judgementCounter.OK+judgementCounter.MEH+judgementCounter.MISS)
  if(denominator===0){ //Edge case
    return 0;
  }
  return (numerator/denominator)*100;
}
