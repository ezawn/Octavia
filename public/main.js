import { handleKeyPress } from './inputHandler.js';
import { startGame } from './game.js';

// DOM Event Listeners
document.addEventListener('keydown', handleKeyPress);

// Start the game
startGame();