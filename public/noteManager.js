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

export function spawnNote(notes) {
  const randomLane = LANES[Math.floor(Math.random() * LANES.length)];
  const lane = LANES.indexOf(randomLane);
  return [...notes, new Note(randomLane, 0, lane)];
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
