import * as settings from "./settings.js";
const { HIT_LINE, LANE_WIDTH, NUM_LANES, CENTER_LANE_X, NOTE_SPEED } = settings;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Global variables
let notes = [];
let score = 0;
let lastSpawn = 0;

function spawnNote() {
  let lanes = [];
// Calculate x positions for each lane
  for (let i = 0; i < NUM_LANES; i++) {
    let x = CENTER_LANE_X + (i - (NUM_LANES - 1) / 2) * LANE_WIDTH;
    lanes.push(x);
  }
// Randomly select a lane before assigning a note to it
  let random_index = Math.floor(Math.random() * lanes.length);
  let random_lane = lanes[random_index];
  let new_note = {
    x: random_lane,
    y: 0,
  };
  notes.push(new_note);
}


//Performs a game tick - updates positions, spawns notes, checks for hits
function update() {
  let now = Date.now();

  if (now - lastSpawn > 100) {
    spawnNote();
    lastSpawn = now;
  }
// Move notes down
  for (let i = 0; i < notes.length; i++) {
    notes[i].y += NOTE_SPEED;
  }
// Remove notes that have fallen off the screen
  let new_notes = [];
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].y < canvas.height + 50) {
      new_notes.push(notes[i]);
    }
  }
  notes = new_notes;
}


//Draws notes, hit line, score
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(0, HIT_LINE);
  ctx.lineTo(canvas.width, HIT_LINE);
  ctx.stroke();

  ctx.fillStyle = "cyan";
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    ctx.beginPath();
    ctx.arc(note.x, note.y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.fillText(`Score: ${score}`, 20, 30);
}

// Main game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
// Handle key presses for hitting notes
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      if (Math.abs(note.y - HIT_LINE) < 20) {
        score += 100;

        notes.splice(i, 1);
        break;
      }
    }
  }
});

gameLoop();