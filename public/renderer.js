export function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawHitLine(ctx, canvas, colour, y) {
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
}

export function drawNotes(ctx, notes, colour, radius) {
    ctx.fillStyle = colour;
    notes.forEach(note => {
        ctx.beginPath();
        ctx.arc(note.x, note.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function drawScore(ctx, score, colour) {
    ctx.fillStyle = colour;
    ctx.fillText(`Score: ${score}`, 20, 30);
}

export function drawHealth(ctx, health, maxHealth, colour) {
    ctx.fillStyle = colour;
    ctx.fillText(`Health: ${health}/${maxHealth}`, 20, 60);
}