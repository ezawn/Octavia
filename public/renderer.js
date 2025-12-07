import { LANES } from "./constants.js";

const LANE_WIDTH = 120;
const KEYBINDS = ["D", "F", "J", "K"];
const LANE_COLOUR = "rgba(255, 255, 255, 0.1)";
const BORDER_COLOUR = "rgba(255, 255, 255, 0.3)";

export function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
/*fillText appears in most functions
The fillText method takes the parameters the text to be displayed, the x and y coordinates and the max width
the max width is optional*/
export function drawLanes(ctx, canvas, hitLine) {
    LANES.forEach((laneX, i) => {
        const laneLeft = laneX - LANE_WIDTH / 2;
        
        //Draw background
        ctx.fillStyle = LANE_COLOUR;
        ctx.fillRect(laneLeft, 0, LANE_WIDTH, canvas.height);
        
        //Draw border around lanes
        ctx.strokeStyle = BORDER_COLOUR;
        ctx.lineWidth = 2;
        ctx.strokeRect(laneLeft, 0, LANE_WIDTH, canvas.height);
        
        //Draw keybind labels. Will be below hitline for visibility
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(KEYBINDS[i], laneX, hitLine + 30);
    });
}

export function drawHitLine(ctx, canvas, colour, y) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
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

export function drawScore(ctx, score, colour, canvas) {
    ctx.fillStyle = colour;
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 830, 30);
}

export function drawHealth(ctx, health, maxHealth, colour, canvas) {
    ctx.fillStyle = colour;
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Health: ${health}/${maxHealth}`, 830, 60);
}

export function drawCombo(ctx, combo, colour, canvas) {
    if (combo === 0) return; //Don't display combo when it's 0
    
    ctx.fillStyle = colour;
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`${combo} COMBO`, canvas.width - 20, 100);
}

export function drawJudgment(ctx, canvas, judgment, displayTime) {
    if (!judgment) return;
    
    const now = Date.now();
    const elapsed = now - displayTime;
    const displayDuration = 500; //Show judgment for 500ms
    
    if (elapsed > displayDuration) return;
    
    //Fade out effect
    const opacity = Math.max(0, 1 - (elapsed / displayDuration));
    
    //Colour based on judgment
    let judgmentColour = "#FFFFFF";
    if (judgment.label === "GREAT") judgmentColour = "#00FFFF";
    else if (judgment.label === "GOOD") judgmentColour = "#00FF00";
    else if (judgment.label === "OK") judgmentColour = "#FFFF00"; 
    else if (judgment.label === "MEH") judgmentColour = "#FF8800";
    else if (judgment.label === "MISS") judgmentColour = "#FF0000";
    
    ctx.fillStyle = judgmentColour;
    ctx.globalAlpha = opacity;
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(judgment.label, canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1.0;
}

export function drawLevelComplete(ctx, canvas, score) {
    //Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    //Title
    ctx.fillStyle = "#00FF00";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL COMPLETE!", canvas.width / 2, canvas.height / 2 - 80);
    
    //Score
    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    //Rank based on score
    let rank = "F";
    let rankColor = "#FF0000";
    if (score >= 30000) { rank = "S"; rankColor = "#FFD700"; }
    else if (score >= 25000) { rank = "A"; rankColor = "#00FF00"; }
    else if (score >= 20000) { rank = "B"; rankColor = "#00FFFF"; }
    else if (score >= 15000) { rank = "C"; rankColor = "#FFFF00"; }
    else if (score >= 10000) { rank = "D"; rankColor = "#FF8800"; }
    
    ctx.fillStyle = rankColor;
    ctx.font = "bold 80px Arial";
    ctx.fillText(rank, canvas.width / 2, canvas.height / 2 + 120);
    
    //Instructions
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "16px Arial";
    ctx.fillText("Press ESC to return to menu", canvas.width / 2, canvas.height - 40);
}

export function drawGameOver(ctx, canvas, score) {
    //Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = "32px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    //Back button
    ctx.font = "18px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("Press ESC to return to menu", canvas.width / 2, canvas.height / 2 + 80);
}