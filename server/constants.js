// Game constants
const GAME_CONSTANTS = {
  // Arena
  ARENA_WIDTH: 2000,
  ARENA_HEIGHT: 2000,
  ARENA_SHAPE: "hexagon", // "circle" or "hexagon"
  
  // Player settings
  PLAYER_RADIUS: 20,
  MAX_SPEED: 5,
  BASE_GRAVITY_STRENGTH: 800, // Increased from 300 to 800
  GRAVITY_RANGE: 1800, // Tripled from 600 to 1800 for much wider area of effect
  GRAVITY_PROXIMITY_THRESHOLD: 60, // New constant - distance below which gravity is nullified
  PULSE_STRENGTH_MULTIPLIER: 12, // Increased from 8 to 12
  PULSE_DURATION: 1000, // ms
  PULSE_COOLDOWN: 10000, // ms
  PULSE_ENERGY_COST: 20,
  COLLAPSE_STRENGTH_MULTIPLIER: 25, // Increased from 15 to 25
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
  BLACK_HOLE_STRENGTH: 1200, // Increased from 600 to 1200
  BLACK_HOLE_PENALTY: 5,
  BLACK_HOLE_MOVE_SPEED: 0.3, // New constant for black hole movement speed
  BLACK_HOLE_COUNT: 4, // Number of black holes to create per room
  NEBULA_RADIUS: 150,
  NEBULA_GRAVITY_MODIFIER: 0.5,
  NEBULA_MOVE_SPEED: 0.2, // New constant for nebula movement speed
  NEBULA_COUNT: 4, // Number of nebulae to create per room
  COMET_RADIUS: 15,
  COMET_SPEED: 8,
  COMET_SPAWN_INTERVAL: 15000, // Reduced from 30000 to 15000 ms (twice as frequent)
  
  // Game flow
  ROUND_DURATION: 180000, // 3 minutes in ms
  GRAVITY_STORM_DURATION: 30000, // 30 seconds in ms
  TICK_RATE: 50 // 20 ticks per second
};

module.exports = { GAME_CONSTANTS };
