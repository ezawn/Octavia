export function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawHitLine(ctx, canvas, color, y) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
}

export function drawNotes(ctx, notes, color, radius) {
    ctx.fillStyle = color;
    notes.forEach(note => {
        ctx.beginPath();
        ctx.arc(note.x, note.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function drawScore(ctx, score, color) {
    ctx.fillStyle = color;
    ctx.fillText(`Score: ${score}`, 20, 30);
}