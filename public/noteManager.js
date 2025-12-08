import { LANES, JUDGEMENTS } from "./constants.js";
//Creates the note class which represents each note in the game (OOP)
export class Note {
  constructor(x, y, lane) {
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.spawnTime = Date.now();
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

  isInHitRange(hitLine, hitThreshold) {
    return Math.abs(this.y - hitLine) < hitThreshold;
  }
  //Calculates the distance in ms between the note and the hit line
  getTimingDifference(hitLine, noteSpeed) {
    const pixelDifference = Math.abs(this.y - hitLine);
    const timingMs = pixelDifference / noteSpeed;
    return timingMs;
  }
  /*Judges notes based on the difference between hit line and note position
  Returns the judgement object*/
  getJudgement(hitLine, noteSpeed) {
    const timingDifference = this.getTimingDifference(hitLine, noteSpeed);  
    if (timingDifference <= JUDGEMENTS.GREAT.threshold) {
      return JUDGEMENTS.GREAT;
    } else if (timingDifference <= JUDGEMENTS.GOOD.threshold) {
      return JUDGEMENTS.GOOD;
    } else if (timingDifference <= JUDGEMENTS.OK.threshold) {
      return JUDGEMENTS.OK;
    } else if (timingDifference <= JUDGEMENTS.MEH.threshold) {
      return JUDGEMENTS.MEH;
    }
    return JUDGEMENTS.MISS;
  }
}

let chartData = null;
let nextNoteIndex = 0;
let gameStartTime = 0;
/*Loads chart data from a given path
Resets note index and game start time*/
export async function loadChart(chartPath) {
  const response = await fetch(chartPath); //Get the chart data from the specified path
  chartData = await response.json(); //Parse the response as JSON and store it in chartData
  nextNoteIndex = 0; //Ensures that the next note is the first note in the chart
  gameStartTime = Date.now(); //Sets the game start time to the current time
}
//Restart chart from beginning
export function resetChart() {
  nextNoteIndex = 0;
  gameStartTime = Date.now();
}
/*Spawns notes based on the chart data and the elapsed time since the game started
Also updates the notes array with new notes when their spawn time is reached*/
export function spawnNote(notes) {
  if (!chartData || nextNoteIndex >= chartData.notes.length) {
    return notes;
  }
  
  const nextNote = chartData.notes[nextNoteIndex];
  const timeSinceStart = Date.now() - gameStartTime;
  
  if (timeSinceStart >= nextNote.time) {
    const laneX = LANES[nextNote.lane];
    nextNoteIndex++;
    return [...notes, new Note(laneX, 0, nextNote.lane)];
  }
  
  return notes;
}
//Updates position of existing notes, removes off-screen notes
export function updateNotes(notes, noteSpeed, canvasHeight) {
  const currentTime = Date.now();
  return notes
    .map(note => note.update(noteSpeed, currentTime))
    .filter(note => !note.isOffScreen(canvasHeight));
}
/*Verifies if note was correctly hit
If the time that the note was hit isInHitRange and the lane is correct, note is scored appropriately
Judgement is returned based on the timing difference*/
export function checkHit(notes, hitLine, hitThreshold, laneX, noteSpeed) {
  const hitIndex = notes.findIndex(note => 
    note.x === laneX && note.isInHitRange(hitLine, hitThreshold)
  );
  if (hitIndex === -1) return { hit: false, notes, judgment: null };

  const hitNote = notes[hitIndex];
  const judgment = hitNote.getJudgement(hitLine, noteSpeed);
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
