import { LANES, JUDGEMENTS, NOTE_SPEED, HIT_LINE, HIT_THRESHOLD } from "./constants.js";
//Creates the note class which represents each note in the game (OOP)
export class Note {
  constructor(x, y, lane, chartTime = 0, gameStartTime = 0) {
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.spawnTime = Date.now();
    this.chartTime = chartTime; //The time since chart start
    this.idealHitTime = gameStartTime + chartTime + (HIT_LINE / NOTE_SPEED); //The time where note should hit the line
  }

  update(noteSpeed, currentTime) {
    const timeSinceSpawn = currentTime - this.spawnTime;
    this.y = timeSinceSpawn * noteSpeed; //Position = time * speed
    return this;
  }
//Determines whether a note is off screen or not along with a small buffer to make it look smoother
  isOffScreen(canvasHeight) {
    return this.y >= canvasHeight + 50;
  }
  /*Judges notes based on the timing of when the key was pressed vs the ideal hit time
  Uses 1x speed timing regardless of to prevent any errors with timings since speed should keep the hit time consistent
  Returns the judgement*/
  getJudgement(keyPressTime) {
    //Find the difference in ms between the ideal time and actual time of input
    const timingDifference = keyPressTime - this.idealHitTime;
    
    let judgment;
    if (Math.abs(timingDifference) <= JUDGEMENTS.GREAT.threshold) {
      judgment = JUDGEMENTS.GREAT;
    } else if (Math.abs(timingDifference) <= JUDGEMENTS.GOOD.threshold) {
      judgment = JUDGEMENTS.GOOD;
    } else if (Math.abs(timingDifference) <= JUDGEMENTS.OK.threshold) {
      judgment = JUDGEMENTS.OK;
    } else if (Math.abs(timingDifference) <= JUDGEMENTS.MEH.threshold) {
      judgment = JUDGEMENTS.MEH;
    } else {
      judgment = JUDGEMENTS.MISS;
    }
    
    console.log(`Lane ${this.lane}: ${judgment.label} - Timing: ${timingDifference.toFixed(1)}ms`);
    return judgment;
  }

  isInHitRange(hitLine, hitThreshold) {
    return Math.abs(this.y - hitLine) < hitThreshold;
  }
}



let chartData = null;
let nextNoteIndex = 0;
let gameStartTime = 0;
/*Loads chart data from a given path
Resets note index and game start time*/
export async function loadChart(chartPath) {
  try{
    const response = await fetch(chartPath); //Get the chart data from the specified path
    chartData = await response.json(); //Parse the response as JSON and store it in chartData
    nextNoteIndex = 0; //Ensures that the next note is the first note in the chart
    gameStartTime = Date.now(); //Sets the game start time to the current time  
  }catch(error) {
    console.error("Failed to load chart:", error)
  }
}
//Restart chart from beginning
export function resetChart() {
  nextNoteIndex = 0;
  gameStartTime = Date.now();
}
/*Spawns notes for normal/faster speeds: spawn later at the top (Y=0)
Positive offset delays the spawn time, giving notes more time to fall*/
function spawnNotePositiveOffset(notes, spawnTimeOffset) {
  if (!chartData) {
    return notes;
  }
  
  const timeSinceStart = Date.now() - gameStartTime;
  
  //If spawnTimeOffset is +, notes spawn later. Gives more time to fall
  while (nextNoteIndex < chartData.notes.length) {
    const nextNote = chartData.notes[nextNoteIndex];
    const spawnThreshold = nextNote.time + spawnTimeOffset;
    
    if (timeSinceStart >= spawnThreshold) {
      const laneX = LANES[nextNote.lane];
      notes = [...notes, new Note(laneX, 0, nextNote.lane, nextNote.time, gameStartTime)];
      nextNoteIndex++;
    } else {
      break; //If note hasn't reached the time to spawn, stop checking
    }
  }
  
  return notes;
}

/*Spawns notes based on the chart data and the elapsed time since the game started
Handles positive offset (faster speeds) and normal spawn*/
export function spawnNote(notes, spawnTimeOffset = 0, currentNoteSpeed = NOTE_SPEED) {
  if (spawnTimeOffset > 0) {
    return spawnNotePositiveOffset(notes, spawnTimeOffset);
  } else {
    // Normal spawn at 1x speed
    if (!chartData) {
      return notes;
    }
    
    const timeSinceStart = Date.now() - gameStartTime;
    
    // Spawn all notes whose time has passed (allow multiple per frame)
    while (nextNoteIndex < chartData.notes.length) {
      const nextNote = chartData.notes[nextNoteIndex];
      
      if (timeSinceStart >= nextNote.time) {
        const laneX = LANES[nextNote.lane];
        notes = [...notes, new Note(laneX, 0, nextNote.lane, nextNote.time, gameStartTime)];
        nextNoteIndex++;
      } else {
        break; // Stop when we hit a note that hasn't spawned yet
      }
    }
    
    return notes;
  }
}
//Updates position of existing notes, removes off-screen notes
export function updateNotes(notes, noteSpeed, canvasHeight) {
  const currentTime = Date.now();
  return notes
    .map(note => note.update(noteSpeed, currentTime))
    .filter(note => !note.isOffScreen(canvasHeight));
}
/*Verifies if note was correctly hit by checking if it's in hit range and timing threshold
Only allows hits on notes within hit range of the hit line
Judgement is returned based on timing difference between key press and ideal hit time*/
export function checkHit(notes, laneX) {
  const keyPressTime = Date.now();
  const hitIndex = notes.findIndex(note => note.x === laneX);
  if (hitIndex === -1) return { hit: false, notes, judgment: null };

  const hitNote = notes[hitIndex];
  // Check if note is in hit range before allowing the hit
  if (!hitNote.isInHitRange(HIT_LINE, HIT_THRESHOLD)) {
    return { hit: false, notes, judgment: null };
  }
  
  const judgment = hitNote.getJudgement(keyPressTime);
  const newNotes = notes.filter((_, i) => i !== hitIndex);
  return { hit: true, notes: newNotes, judgment };
}
//Confirms whether or not the chart has spawned all notes
export function isChartFinished() {
  return chartData && nextNoteIndex >= chartData.notes.length;
}
//Calculates the number of notes in the chart
export function getChartNoteCount() {
  if (!chartData || !chartData.notes) {
    return 0;
  }
  return chartData.notes.length;
}

let judgementCounter={
  GREAT:0,
  GOOD:0,
  OK:0,
  MEH:0,
  MISS:0
}
window.judgementCounter=judgementCounter
export function counterIncrease(judgement){
  if(judgement===JUDGEMENTS.GREAT){
    judgementCounter.GREAT+=1;
  }
  else if(judgement===JUDGEMENTS.GOOD){
    judgementCounter.GOOD+=1;
  }
  else if(judgement===JUDGEMENTS.OK){
    judgementCounter.OK+=1;
  }
  else if(judgement===JUDGEMENTS.MEH){
    judgementCounter.MEH+=1;
  }
  else if(judgement===JUDGEMENTS.MISS){
    judgementCounter.MISS+=1;
  }
}

export function getJudgementCounter(){
  return judgementCounter;
}

export function resetJudgementCounter(){
  judgementCounter.GREAT = 0;
  judgementCounter.GOOD = 0;
  judgementCounter.OK = 0;
  judgementCounter.MEH = 0;
  judgementCounter.MISS = 0;
}

/*Checks if the first note of the chart has passed the hit line
Returns true only if the first note has spawned and passed the hit line threshold
This prevents false misses before the song actually starts with notes*/
export function hasFirstNotePassedHitLine() {
  if (!chartData || chartData.notes.length === 0) {
    return true; // No chart or no notes, allow misses
  }
  
  // If no notes have spawned yet, first note hasn't passed
  if (nextNoteIndex === 0) {
    return false;
  }
  
  const timeSinceStart = Date.now() - gameStartTime;
  const firstNoteTime = chartData.notes[0].time;
  const timeToReachHitLine = HIT_LINE / NOTE_SPEED;
  const firstNotePassedTime = firstNoteTime + timeToReachHitLine + 50; // +50ms buffer
  
  return timeSinceStart >= firstNotePassedTime;
}
