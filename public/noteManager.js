export class Note {
  constructor(x, y, lane) {
    this.x = x;
    this.y = y;
    this.lane = lane;
  }

  update(noteSpeed) {
    this.y += noteSpeed;
    return this;
  }

  isOffScreen(canvasHeight) {
    return this.y >= canvasHeight + 50;
  }

  isInHitRange(hitLine, hitThreshold) {
    return Math.abs(this.y - hitLine) < hitThreshold;
  }
}

import { LANES } from './constants.js';

let chartData = null;
let nextNoteIndex = 0;
let gameStartTime = 0;

export async function loadChart(chartPath) {
  const response = await fetch(chartPath); //Get the chart data from the specified path
  chartData = await response.json(); //Parse the response as JSON and store it in chartData
  nextNoteIndex = 0; //Ensures that the next note is the first note in the chart
  gameStartTime = Date.now(); //Sets the game start time to the current time
}

export function resetChart() {
  nextNoteIndex = 0;
  gameStartTime = Date.now();
}

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

export function updateNotes(notes, noteSpeed, canvasHeight) {
  return notes
    .map(note => note.update(noteSpeed))
    .filter(note => !note.isOffScreen(canvasHeight));
}

export function checkHit(notes, hitLine, hitThreshold, laneX) {
  const hitIndex = notes.findIndex(note => 
    note.x === laneX && note.isInHitRange(hitLine, hitThreshold)
  );
  if (hitIndex === -1) return { hit: false, notes };

  const newNotes = notes.filter((_, i) => i !== hitIndex);
  return { hit: true, notes: newNotes };
}
