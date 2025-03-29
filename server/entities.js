const { GAME_CONSTANTS } = require('./constants');
const { ObjectPool } = require('./objectPool');

// Object pools for entity types
const cometPool = new ObjectPool(Object, 20, (comet) => {
  // Reset comet properties
  comet.type = 'comet';
  comet.x = 0;
  comet.y = 0;
  comet.velocityX = 0;
  comet.velocityY = 0;
  comet.radius = GAME_CONSTANTS.COMET_RADIUS;
  return comet;
});

// Track objects to prevent garbage collection spikes
const activeEntities = new Set();

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

// Helper function to calculate squared distance (more efficient)
function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

// Generate a position that's sufficiently far from existing hazards
function generateSpreadOutPosition(existingHazards, minDistance, radius) {
  // Ensure a good minimum distance
  const minimumDistance = minDistance || Math.max(GAME_CONSTANTS.ARENA_WIDTH, GAME_CONSTANTS.ARENA_HEIGHT) / 10;
  const minDistanceSquared = minimumDistance * minimumDistance;
  
  // Try up to 50 times to find a good position
  for (let attempts = 0; attempts < 50; attempts++) {
    // Generate random position
    const x = radius + Math.random() * (GAME_CONSTANTS.ARENA_WIDTH - 2 * radius);
    const y = radius + Math.random() * (GAME_CONSTANTS.ARENA_HEIGHT - 2 * radius);
    
    // Check if this position is far enough from all existing hazards
    let isFarEnough = true;
    for (const hazard of existingHazards) {
      const distSquared = distanceSquared(x, y, hazard.x, hazard.y);
      const minSeparation = minimumDistance + hazard.radius + radius;
      if (distSquared < minSeparation * minSeparation) {
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

// Helper function to create a comet hazard (now using object pooling)
function createComet() {
  // Get a comet from the pool
  const comet = cometPool.get();
  
  // Start from edge of arena
  const startFromTop = Math.random() > 0.5;
  comet.x = Math.random() * GAME_CONSTANTS.ARENA_WIDTH;
  comet.y = startFromTop ? 0 : GAME_CONSTANTS.ARENA_HEIGHT;
  
  // Angle between 30 and 150 degrees if from top, or 210 and 330 if from bottom
  const angleRange = startFromTop ? [Math.PI/6, 5*Math.PI/6] : [7*Math.PI/6, 11*Math.PI/6];
  const angle = angleRange[0] + Math.random() * (angleRange[1] - angleRange[0]);
  
  comet.velocityX = Math.cos(angle) * GAME_CONSTANTS.COMET_SPEED;
  comet.velocityY = Math.sin(angle) * GAME_CONSTANTS.COMET_SPEED;
  
  // Add to active entities set
  activeEntities.add(comet);
  
  return comet;
}

// Release a comet back to the pool
function releaseComet(comet) {
  if (comet && comet.type === 'comet') {
    activeEntities.delete(comet);
    cometPool.release(comet);
  }
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
  releaseComet,
  createDistributedHazards,
  cometPool,
  activeEntities
};
