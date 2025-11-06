export class Note {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class NoteManager {
    constructor() {
        this.notes = [];
        this.lastSpawn = 0;
    }

    spawnNote() {
        this.notes.push(new Note(400, 0)); // center lane
    }

    updateNotes(noteSpeed, canvasHeight) {
        this.notes.forEach(note => note.y += noteSpeed);
        // Remove notes that pass the screen
        this.notes = this.notes.filter(note => note.y < canvasHeight + 50);
    }

    checkHit(hitLine, hitThreshold) {
        let hit = false;
        this.notes.forEach((note, index) => {
            if (Math.abs(note.y - hitLine) < hitThreshold) {
                this.notes.splice(index, 1); // remove hit note
                hit = true;
            }
        });
        return hit;
    }
}