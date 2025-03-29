const { GAME_CONSTANTS } = require('./constants');

// Helper function to create a new player
function createPlayer(id, username) {
  // Random position within the arena
  const x = Math.random() * GAME_CONSTANTS.ARENA_WIDTH;
  const y = Math.random() * GAME_CONSTANTS.ARENA_HEIGHT;
  
  return {
    id,
    username,
    x,
    y,
    velocityX: 0,
    velocityY: 0,
    score: 0,
    energy: GAME_CONSTANTS.MAX_ENERGY,
    gravityStrength: GAME_CONSTANTS.BASE_GRAVITY_STRENGTH,
    movementDirection: { x: 0, y: 0 },
    lastMoveTime: Date.now(),
    isPulsing: false,
    pulseStartTime: 0,
    lastPulseTime: 0,
    isCollapsing: false,
    collapseStartTime: 0,
    lastCollapseTime: 0,
    isTagged: false,
    lastTaggedTime: 0,
    wasLastUntagged: false
  };
}

// Helper function to create a black hole hazard
function createBlackHole() {
  return {
    type: 'blackHole',
    x: Math.random() * GAME_CONSTANTS.ARENA_WIDTH,
    y: Math.random() * GAME_CONSTANTS.ARENA_HEIGHT,
    radius: GAME_CONSTANTS.BLACK_HOLE_RADIUS,
    strength: GAME_CONSTANTS.BLACK_HOLE_STRENGTH
  };
}

// Helper function to create a nebula hazard
function createNebula() {
  return {
    type: 'nebula',
    x: Math.random() * GAME_CONSTANTS.ARENA_WIDTH,
    y: Math.random() * GAME_CONSTANTS.ARENA_HEIGHT,
    radius: GAME_CONSTANTS.NEBULA_RADIUS,
    gravityModifier: GAME_CONSTANTS.NEBULA_GRAVITY_MODIFIER
  };
}

// Helper function to create a comet hazard
function createComet() {
  // Start from edge of arena
  const startFromTop = Math.random() > 0.5;
  const x = Math.random() * GAME_CONSTANTS.ARENA_WIDTH;
  const y = startFromTop ? 0 : GAME_CONSTANTS.ARENA_HEIGHT;
  
  // Angle between 30 and 150 degrees if from top, or 210 and 330 if from bottom
  const angleRange = startFromTop ? [Math.PI/6, 5*Math.PI/6] : [7*Math.PI/6, 11*Math.PI/6];
  const angle = angleRange[0] + Math.random() * (angleRange[1] - angleRange[0]);
  
  return {
    type: 'comet',
    x,
    y,
    radius: GAME_CONSTANTS.COMET_RADIUS,
    velocityX: Math.cos(angle) * GAME_CONSTANTS.COMET_SPEED,
    velocityY: Math.sin(angle) * GAME_CONSTANTS.COMET_SPEED
  };
}

module.exports = {
  createPlayer,
  createBlackHole,
  createNebula,
  createComet
};
