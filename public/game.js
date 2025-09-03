import * as settings from "./settings.js";
const { NOTE_SPEED, HIT_LINE, LANE_WIDTH, NUM_LANES, CENTER_LANE } = settings;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


let notes = [];
let score = 0;
let lastSpawn = 0;


function spawnNote() {
  // The nth element is the x coordinate of the centre of the nth lane
  const lanes = []; 
  for (let i = 0; i < NUM_LANES; i++) {
    lanes.push(CENTER_LANE + (i - (NUM_LANES-1)/2) * LANE_WIDTH);
  }
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
  notes.push({ x: randomLane, y: 0 });
}

function update() {
  const now = Date.now();
  if (now - lastSpawn > 100) {

    spawnNote();
    lastSpawn = now;
  }

  notes.forEach((note) => (note.y += NOTE_SPEED));

  // Notes that fall too far get deleted
  notes = notes.filter((note) => note.y < canvas.height + 50);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw hit line
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(0, HIT_LINE);
  ctx.lineTo(canvas.width, HIT_LINE);
  ctx.stroke();

  // Draw notes
  ctx.fillStyle = "cyan";
  notes.forEach((note) => {
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

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    // hit with spacebar
    notes.forEach((note, index) => {
      if (Math.abs(note.y - HIT_LINE) < 20) {
        score += 100;
        notes.splice(index, 1); // remove hit note
      }
    });
  }
});

gameLoop();
