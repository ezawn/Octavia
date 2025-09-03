const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let notes = [];
let score = 0;
let lastSpawn = 0;
const noteSpeed = 4;
const hitLine = 500; // Y position where you should hit notes

function spawnNote() {
    notes.push({ x: 400, y: 0 }); // center lane
}

function update() {
    const now = Date.now();
    if (now - lastSpawn > 1000) { // spawn every 1 second
        spawnNote();
        lastSpawn = now;
    }

    notes.forEach(note => note.y += noteSpeed);

    // Remove notes that pass the screen
    notes = notes.filter(note => note.y < canvas.height + 50);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hit line
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(0, hitLine);
    ctx.lineTo(canvas.width, hitLine);
    ctx.stroke();

    // Draw notes
    ctx.fillStyle = "cyan";
    notes.forEach(note => {
        ctx.beginPath();
        ctx.arc(note.x, note.y, 20, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw score
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${score}`, 20, 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Handle keypress
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") { // hit with spacebar
        notes.forEach((note, index) => {
            if (Math.abs(note.y - hitLine) < 20) {
                score += 100;
                notes.splice(index, 1); // remove hit note
            }
        });
    }
});

gameLoop();
