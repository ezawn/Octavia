export class Note {
    // Creates a new note at position (x,y)
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Moves the note down by noteSpeed pixels
    update(noteSpeed) {
        this.y += noteSpeed;
        return this;
    }

    // Checks if note has moved below the canvas
    isOffScreen(canvasHeight) {
        return this.y >= canvasHeight + 50;  // 50px buffer
    }

    // Checks if note is within hitting range
    isInHitRange(hitLine, hitThreshold) {
        return Math.abs(this.y - hitLine) < hitThreshold;  // Checks distance to hit line
    }
}

export function spawnNote(notes) {
    return [...notes, new Note(400, 0)]; // center lane
}

export function updateNotes(notes, noteSpeed, canvasHeight) {
    return notes
        .map(note => note.update(noteSpeed))
        .filter(note => !note.isOffScreen(canvasHeight));
}

export function checkHit(notes, hitLine, hitThreshold) {
    const hitIndex = notes.findIndex(note => note.isInHitRange(hitLine, hitThreshold));
    if (hitIndex === -1) return { hit: false, notes };
    
    const newNotes = [...notes];
    newNotes.splice(hitIndex, 1);
    return { hit: true, notes: newNotes };
}