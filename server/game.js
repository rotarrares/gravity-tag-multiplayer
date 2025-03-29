// Main game module
const { GAME_CONSTANTS } = require('./constants');
const { createPlayer, createBlackHole, createNebula, createComet } = require('./entities');
const GameManager = require('./gameManager');
const Physics = require('./physics');

// Export all game components
module.exports = {
  GameManager,
  GAME_CONSTANTS,
  createPlayer,
  createBlackHole,
  createNebula,
  createComet,
  Physics
};
