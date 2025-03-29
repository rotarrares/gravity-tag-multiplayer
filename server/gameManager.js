const { GAME_CONSTANTS } = require('./constants');
const Physics = require('./physics');
const HazardManager = require('./hazards');
const { createBlackHole, createNebula } = require('./entities');

// Game manager handles all game logic
class GameManager {
  constructor() {
    this.rooms = {};
  }
  
  // Create a new game room
  createRoom(roomId) {
    this.rooms[roomId] = {
      players: {},
      hazards: [],
      startTime: Date.now(),
      timeRemaining: GAME_CONSTANTS.ROUND_DURATION,
      lastCometSpawn: 0
    };
    
    // Add initial hazards
    this.rooms[roomId].hazards.push(createBlackHole());
    this.rooms[roomId].hazards.push(createBlackHole());
    this.rooms[roomId].hazards.push(createNebula());
    this.rooms[roomId].hazards.push(createNebula());
  }
  
  // Add player to a room
  addPlayerToRoom(roomId, player) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].players[player.id] = player;
    }
  }
  
  // Remove player from a room
  removePlayerFromRoom(roomId, playerId) {
    if (this.rooms[roomId] && this.rooms[roomId].players[playerId]) {
      delete this.rooms[roomId].players[playerId];
    }
  }
  
  // Update player movement direction
  updatePlayerMovement(roomId, playerId, direction) {
    const room = this.rooms[roomId];
    const player = room?.players[playerId];
    
    if (player) {
      player.movementDirection = direction;
      player.lastMoveTime = Date.now();
    }
  }
  
  // Trigger player gravity pulse ability
  triggerPlayerPulse(roomId, playerId) {
    const room = this.rooms[roomId];
    const player = room?.players[playerId];
    
    if (player) {
      const now = Date.now();
      
      // Check cooldown and energy
      if (now - player.lastPulseTime >= GAME_CONSTANTS.PULSE_COOLDOWN && 
          player.energy >= GAME_CONSTANTS.PULSE_ENERGY_COST) {
        
        player.isPulsing = true;
        player.pulseStartTime = now;
        player.lastPulseTime = now;
        player.energy -= GAME_CONSTANTS.PULSE_ENERGY_COST;
        
        return true;
      }
    }
    
    return false;
  }
  
  // Trigger player collapse ability
  triggerPlayerCollapse(roomId, playerId) {
    const room = this.rooms[roomId];
    const player = room?.players[playerId];
    
    if (player) {
      const now = Date.now();
      
      // Check cooldown and energy
      if (now - player.lastCollapseTime >= GAME_CONSTANTS.COLLAPSE_COOLDOWN && 
          player.energy >= GAME_CONSTANTS.COLLAPSE_ENERGY_COST) {
        
        player.isCollapsing = true;
        player.collapseStartTime = now;
        player.lastCollapseTime = now;
        player.energy -= GAME_CONSTANTS.COLLAPSE_ENERGY_COST;
        
        return true;
      }
    }
    
    return false;
  }

  // Handle energy regeneration
  regenerateEnergy(room) {
    for (const player of Object.values(room.players)) {
      // Regenerate energy over time
      player.energy = Math.min(
        GAME_CONSTANTS.MAX_ENERGY,
        player.energy + GAME_CONSTANTS.ENERGY_REGEN_RATE * (GAME_CONSTANTS.TICK_RATE / 1000)
      );
    }
  }
  
  // Main update loop for all game rooms
  update() {
    const now = Date.now();
    
    // Update each room
    Object.entries(this.rooms).forEach(([roomId, room]) => {
      // Update time remaining
      room.timeRemaining = Math.max(0, GAME_CONSTANTS.ROUND_DURATION - (now - room.startTime));
      
      // Check for gravity storm (final 30 seconds)
      const inGravityStorm = room.timeRemaining <= GAME_CONSTANTS.GRAVITY_STORM_DURATION;
      
      // Apply physics
      Physics.applyMovement(room);
      Physics.applyGravity(room);
      Physics.applyBlackHoles(room);
      
      // Update hazards
      HazardManager.updateComets(room);
      
      // Handle game mechanics
      Physics.handleTagging(room);
      this.regenerateEnergy(room);
      
      // Stronger gravity during storm for more dramatic effects
      if (inGravityStorm) {
        for (const player of Object.values(room.players)) {
          player.gravityStrength *= 3;
        }
      }
      
      // Check if round is over
      if (room.timeRemaining === 0) {
        this.resetRound(room);
      }
    });
  }
  
  // Reset the round
  resetRound(room) {
    const now = Date.now();
    
    // Reset time
    room.startTime = now;
    room.timeRemaining = GAME_CONSTANTS.ROUND_DURATION;
    room.lastCometSpawn = 0;
    
    // Reset hazards
    room.hazards = [];
    room.hazards.push(createBlackHole());
    room.hazards.push(createBlackHole());
    room.hazards.push(createNebula());
    room.hazards.push(createNebula());
    
    // Reset player positions and tagged status
    for (const player of Object.values(room.players)) {
      player.x = Math.random() * GAME_CONSTANTS.ARENA_WIDTH;
      player.y = Math.random() * GAME_CONSTANTS.ARENA_HEIGHT;
      player.velocityX = 0;
      player.velocityY = 0;
      player.isTagged = false;
      player.wasLastUntagged = false;
    }
  }
}

module.exports = GameManager;
