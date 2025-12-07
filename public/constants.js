export const NOTE_SPEED = 0.3; // pixels per millisecond (frame-rate independent)
export const HIT_LINE = 500;
export const SPAWN_INTERVAL = 1000;
export const NOTE_RADIUS = 20;
export const HIT_THRESHOLD = 100;
export const MAX_HEALTH = 100;
export const HEALTH_DAMAGE_PER_MISS = 10;
export const LANES = [150, 300, 500, 650];
export const COLOURS = {
    HIT_LINE: "yellow",
    NOTE: "cyan",
    SCORE: "white",
    HEALTH: "red"
};
export const JUDGEMENTS = {
    GREAT: { threshold: 80, score: 300, label: "GREAT" },
    GOOD: { threshold: 100, score: 200, label: "GOOD" },
    OK: { threshold: 120, score: 100, label: "OK" },
    MEH: { threshold: 150, score: 50, label: "MEH" },
    MISS: { threshold: Infinity, score: 0, label: "MISS" }
};