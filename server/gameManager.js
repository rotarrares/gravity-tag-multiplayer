const { GAME_CONSTANTS } = require('./constants');
const Physics = require('./physics');
const HazardManager = require('./hazards');
const { createDistributedHazards } = require('./entities');
const SpatialGrid = require('./physics/spatial');

// Game manager handles all game logic
class GameManager {
  constructor() {
    this.rooms = {};
    this.roomStates = {}; // For delta compression
  }
  
  // Create a new game room
  createRoom(roomId) {
    this.rooms[roomId] = {
      players: {},
      hazards: [],
      startTime: Date.now(),
      timeRemaining: GAME_CONSTANTS.ROUND_DURATION,
      lastCometSpawn: 0,
      // Add spatial grid for optimized physics
      spatialGrid: new SpatialGrid(300)
    };
    
    // Initialize the previous state for delta compression
    this.roomStates[roomId] = {
      players: {},
      hazards: []
    };
    
    // Add initial hazards (now using the distributed function)
    this.rooms[roomId].hazards = createDistributedHazards();
    
    // Initialize direction for hazards
    for (const hazard of this.rooms[roomId].hazards) {
      if (hazard.type === 'blackHole' || hazard.type === 'nebula') {
        hazard.directionX = Math.random() * 2 - 1;
        hazard.directionY = Math.random() * 2 - 1;
        
        // Normalize direction vector
        const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
        hazard.directionX /= magnitude;
        hazard.directionY /= magnitude;
      }
    }
  }
  
  // Add player to a room
  addPlayerToRoom(roomId, player) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].players[player.id] = player;
      
      // Add to state tracking for delta compression
      this.roomStates[roomId].players[player.id] = {
        x: player.x,
        y: player.y,
        isTagged: player.isTagged,
        score: player.score,
        username: player.username,
        isPulsing: false,
        isCollapsing: false,
        energy: player.energy
      };
    }
  }
  
  // Remove player from a room
  removePlayerFromRoom(roomId, playerId) {
    if (this.rooms[roomId] && this.rooms[roomId].players[playerId]) {
      delete this.rooms[roomId].players[playerId];
      
      // Clean up state tracking
      if (this.roomStates[roomId]?.players[playerId]) {
        delete this.roomStates[roomId].players[playerId];
      }
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
    // Constant for energy regen - precomputed
    const energyRegen = GAME_CONSTANTS.ENERGY_REGEN_RATE * (GAME_CONSTANTS.TICK_RATE / 1000);
    const maxEnergy = GAME_CONSTANTS.MAX_ENERGY;
    
    for (const player of Object.values(room.players)) {
      // Fast min operation for energy capping
      player.energy = player.energy + energyRegen;
      if (player.energy > maxEnergy) player.energy = maxEnergy;
    }
  }
  
  // Generate delta state for efficient network updates
  generateDeltaState(roomId) {
    const room = this.rooms[roomId];
    const previousState = this.roomStates[roomId];
    const delta = {
      players: {},
      hazards: [],
      timeRemaining: room.timeRemaining
    };
    
    // Calculate player deltas with special treatment for animation states
    for (const [playerId, player] of Object.entries(room.players)) {
      const prevPlayer = previousState.players[playerId];
      
      // Set up a detection flag for any real changes
      let hasChanges = false;
      
      // Create a baseline for this player's updates
      const playerUpdate = {
        x: player.x,
        y: player.y,
        isTagged: player.isTagged,
        score: player.score,
        username: player.username,
        energy: player.energy
      };
      
      // Special handling for animation states
      // Only include pulse/collapse states in the update if they've just changed
      // from false to true (starting), or if they were true and are now false (ending)
      if (!prevPlayer) {
        // New player, include everything
        playerUpdate.isPulsing = player.isPulsing;
        playerUpdate.isCollapsing = player.isCollapsing;
        hasChanges = true;
      } else {
        // Check for regular property changes
        if (prevPlayer.x !== player.x || 
            prevPlayer.y !== player.y || 
            prevPlayer.isTagged !== player.isTagged ||
            prevPlayer.score !== player.score ||
            prevPlayer.energy !== player.energy) {
          hasChanges = true;
        }
        
        // Handle pulse state - only include if it's a transition
        if (prevPlayer.isPulsing !== player.isPulsing) {
          playerUpdate.isPulsing = player.isPulsing;
          hasChanges = true;
        }
        
        // Handle collapse state - only include if it's a transition
        if (prevPlayer.isCollapsing !== player.isCollapsing) {
          playerUpdate.isCollapsing = player.isCollapsing;
          hasChanges = true;
        }
      }
      
      // If we have actual changes, include the player in the delta
      if (hasChanges) {
        delta.players[playerId] = playerUpdate;
        
        // Update previous state with current values for next comparison
        previousState.players[playerId] = {
          x: player.x,
          y: player.y,
          isTagged: player.isTagged,
          score: player.score,
          username: player.username,
          isPulsing: player.isPulsing,
          isCollapsing: player.isCollapsing,
          energy: player.energy
        };
      }
    }
    
    // For hazards, track if they've changed by keeping a signature of each hazard state
    // This avoids resending identical hazards
    const currentHazardState = JSON.stringify(
      room.hazards.map(h => ({type: h.type, x: h.x, y: h.y}))
    );
    
    if (!previousState.hazardSignature || previousState.hazardSignature !== currentHazardState) {
      delta.hazards = room.hazards;
      previousState.hazardSignature = currentHazardState;
    }
    
    return delta;
  }
  
  // Generate full game state (no delta)
  generateFullState(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;
    
    return {
      players: room.players,
      hazards: room.hazards,
      timeRemaining: room.timeRemaining
    };
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
      
      // Update the spatial grid with all current objects
      const allObjects = [
        ...Object.values(room.players),
        ...room.hazards
      ];
      room.spatialGrid.update(allObjects);
      
      // Apply physics
      Physics.applyMovement(room);
      Physics.applyGravity(room);
      Physics.applyBlackHoles(room);
      Physics.moveHazards(room);
      
      // Update hazards
      HazardManager.updateComets(room);
      
      // Handle game mechanics
      Physics.handleTagging(room);
      this.regenerateEnergy(room);
      
      // Stronger gravity during storm for more dramatic effects
      if (inGravityStorm) {
        for (const player of Object.values(room.players)) {
          player.gravityStrength *= 4;
        }
      }
      
      // Check if round is over
      if (room.timeRemaining === 0) {
        this.resetRound(room);
      }
      
      // Update animation states based on time
      for (const player of Object.values(room.players)) {
        // Check if pulse animation should end
        if (player.isPulsing) {
          const pulseElapsed = now - player.pulseStartTime;
          if (pulseElapsed > GAME_CONSTANTS.PULSE_DURATION) {
            player.isPulsing = false;
          }
        }
        
        // Check if collapse animation should end
        if (player.isCollapsing) {
          const collapseElapsed = now - player.collapseStartTime;
          if (collapseElapsed > GAME_CONSTANTS.COLLAPSE_DURATION) {
            player.isCollapsing = false;
          }
        }
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
    
    // Reset hazards with new distributed pattern
    room.hazards = createDistributedHazards();
    
    // Initialize direction for hazards
    for (const hazard of room.hazards) {
      if (hazard.type === 'blackHole' || hazard.type === 'nebula') {
        hazard.directionX = Math.random() * 2 - 1;
        hazard.directionY = Math.random() * 2 - 1;
        
        // Normalize direction vector
        const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
        hazard.directionX /= magnitude;
        hazard.directionY /= magnitude;
      }
    }
    
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
