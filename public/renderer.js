export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawHitLine(color, y) {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
    }

    drawNotes(notes, color, radius) {
        this.ctx.fillStyle = color;
        notes.forEach(note => {
            this.ctx.beginPath();
            this.ctx.arc(note.x, note.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawScore(score, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillText(`Score: ${score}`, 20, 30);
    }
}