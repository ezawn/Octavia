export class Note {
    constructor(x, y) {
        this.x = x;
        this.y = y;
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