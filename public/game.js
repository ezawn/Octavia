import * as settings from "./settings.js";
const { HIT_LINE, LANE_WIDTH, NUM_LANES, CENTER_LANE_X, NOTE_SPEED } = settings;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Global variables
let notes = [];
let score = 0;
let lastSpawn = 0;

function spawnNote() { // Spawns a new note at a random lane
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
    y: 0, //Notes start at the top
  };
  notes.push(new_note);
}


//Performs a game tick - updates positions, spawns notes, checks for hits
function update() {
  let now = Date.now();

  if (now - lastSpawn > 1000) { //Spawn a new note every second
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
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  ctx.strokeStyle = "red"; // Hit line color
  ctx.beginPath(); // Draw hit line
  ctx.moveTo(0, HIT_LINE); // Start at left edge
  ctx.lineTo(canvas.width, HIT_LINE); // End at right edge
  ctx.stroke(); // Render the hit line

  ctx.fillStyle = "cyan"; // Note color
  for (let i = 0; i < notes.length; i++) {  
    let note = notes[i];
    ctx.beginPath(); 
    ctx.arc(note.x, note.y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "white"; // Score color
  ctx.fillText(`Score: ${score}`, 20, 30);
}

// Main game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop); // Repeat the loop
}
// Handle key presses for hitting notes (QWOP from left to right)
document.addEventListener("keydown", function (e) {
  // figure out which lane was hit based on key
  let targetLane = -1;
  if (e.code === "KeyQ") targetLane = 0;        // 1st lane
  else if (e.code === "KeyW") targetLane = 1;    // 2nd lane
  else if (e.code === "KeyO") targetLane = 2;    // 3rd lane
  else if (e.code === "KeyP") targetLane = 3;    // 4th lane
  
  if (targetLane !== -1) {
    // calculate the x position of the lane that was hit
    let laneX = CENTER_LANE_X + (targetLane - (NUM_LANES-1)/2) * LANE_WIDTH;
    
    // Check if note is hit
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      // Increase score if note is in correct lane and close to hit line
      if (Math.abs(note.x - laneX) < 10 && Math.abs(note.y - HIT_LINE) < 20) {
        score += 100;
        notes.splice(i, 1);
        break;  // Ensures that score only updates for one note at a time
      }
    }
  }
});

gameLoop();