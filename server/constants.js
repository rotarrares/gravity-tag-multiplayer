// Game constants
const GAME_CONSTANTS = {
  // Arena
  ARENA_WIDTH: 2000,
  ARENA_HEIGHT: 2000,
  ARENA_SHAPE: "hexagon", // "circle" or "hexagon"
  
  // Player settings
  PLAYER_RADIUS: 20,
  MAX_SPEED: 5,
  BASE_GRAVITY_STRENGTH: 300, // Reduced from 450 for less intense gravity
  GRAVITY_RANGE: 600, // Increased from 200 to 600 (3x) for wider area of effect
  PULSE_STRENGTH_MULTIPLIER: 8,
  PULSE_DURATION: 1000, // ms
  PULSE_COOLDOWN: 10000, // ms
  PULSE_ENERGY_COST: 20,
  COLLAPSE_STRENGTH_MULTIPLIER: 15,
  COLLAPSE_DURATION: 3000, // ms
  COLLAPSE_COOLDOWN: 30000, // ms
  COLLAPSE_ENERGY_COST: 50,
  
  // Energy settings
  MAX_ENERGY: 100,
  ENERGY_REGEN_RATE: 5, // per second
  
  // Tagging
  TAG_RADIUS: 30,
  TAG_INVULNERABILITY: 2000, // ms
  TAG_POINTS: 1,
  TAGGED_POINTS_LOST: 1,
  
  // Hazards
  BLACK_HOLE_RADIUS: 50,
  BLACK_HOLE_STRENGTH: 600,
  BLACK_HOLE_PENALTY: 5,
  NEBULA_RADIUS: 150,
  NEBULA_GRAVITY_MODIFIER: 0.5,
  COMET_RADIUS: 15,
  COMET_SPEED: 8,
  COMET_SPAWN_INTERVAL: 30000, // ms
  
  // Game flow
  ROUND_DURATION: 180000, // 3 minutes in ms
  GRAVITY_STORM_DURATION: 30000, // 30 seconds in ms
  TICK_RATE: 50 // 20 ticks per second
};

module.exports = { GAME_CONSTANTS };
