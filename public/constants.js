export const NOTE_SPEED = 0.3;
export const HIT_LINE = 500;
export const SPAWN_INTERVAL = 1000;
export const NOTE_RADIUS = 20;
export const HIT_THRESHOLD = 100;
export const MAX_HEALTH = 100;
export const HEALTH_DAMAGE_PER_MISS = 10;
export const LANES = [150, 300, 450, 600];
export const COLOURS = {
    HIT_LINE: "yellow",
    NOTE: "cyan",
    SCORE: "white",
    HEALTH: "red"
};
export const JUDGEMENTS = {
    GREAT: { threshold: 80, baseScore: 300, label: "GREAT" },
    GOOD: { threshold: 100, baseScore: 200, label: "GOOD" },
    OK: { threshold: 120, baseScore: 100, label: "OK" },
    MEH: { threshold: 150, baseScore: 50, label: "MEH" },
    MISS: { threshold: Infinity, baseScore: 0, label: "MISS" }
};
export const MAX_SCORE = 1000000;