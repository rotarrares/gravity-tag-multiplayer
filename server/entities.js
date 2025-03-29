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

// Helper function to calculate distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Generate a position that's sufficiently far from existing hazards
function generateSpreadOutPosition(existingHazards, minDistance, radius) {
  // Ensure a good minimum distance
  const minimumDistance = minDistance || Math.max(GAME_CONSTANTS.ARENA_WIDTH, GAME_CONSTANTS.ARENA_HEIGHT) / 10;
  
  // Try up to 50 times to find a good position
  for (let attempts = 0; attempts < 50; attempts++) {
    // Generate random position
    const x = radius + Math.random() * (GAME_CONSTANTS.ARENA_WIDTH - 2 * radius);
    const y = radius + Math.random() * (GAME_CONSTANTS.ARENA_HEIGHT - 2 * radius);
    
    // Check if this position is far enough from all existing hazards
    let isFarEnough = true;
    for (const hazard of existingHazards) {
      const dist = distance(x, y, hazard.x, hazard.y);
      if (dist < minimumDistance + hazard.radius + radius) {
        isFarEnough = false;
        break;
      }
    }
    
    // If position is good, return it
    if (isFarEnough) {
      return { x, y };
    }
  }
  
  // If we couldn't find a good position after many attempts, fall back to random
  return {
    x: radius + Math.random() * (GAME_CONSTANTS.ARENA_WIDTH - 2 * radius),
    y: radius + Math.random() * (GAME_CONSTANTS.ARENA_HEIGHT - 2 * radius)
  };
}

// Helper function to create a black hole hazard
function createBlackHole(existingHazards = []) {
  const pos = generateSpreadOutPosition(existingHazards, 300, GAME_CONSTANTS.BLACK_HOLE_RADIUS);
  
  return {
    type: 'blackHole',
    x: pos.x,
    y: pos.y,
    radius: GAME_CONSTANTS.BLACK_HOLE_RADIUS,
    strength: GAME_CONSTANTS.BLACK_HOLE_STRENGTH
  };
}

// Helper function to create a nebula hazard
function createNebula(existingHazards = []) {
  const pos = generateSpreadOutPosition(existingHazards, 300, GAME_CONSTANTS.NEBULA_RADIUS);
  
  return {
    type: 'nebula',
    x: pos.x,
    y: pos.y,
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

// Function to generate distributed hazards for a room
function createDistributedHazards() {
  const hazards = [];
  
  // Create black holes
  for (let i = 0; i < GAME_CONSTANTS.BLACK_HOLE_COUNT; i++) {
    hazards.push(createBlackHole(hazards));
  }
  
  // Create nebulae
  for (let i = 0; i < GAME_CONSTANTS.NEBULA_COUNT; i++) {
    hazards.push(createNebula(hazards));
  }
  
  return hazards;
}

module.exports = {
  createPlayer,
  createBlackHole,
  createNebula,
  createComet,
  createDistributedHazards
};
