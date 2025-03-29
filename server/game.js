// Game constants
const GAME_CONSTANTS = {
  // Arena
  ARENA_WIDTH: 2000,
  ARENA_HEIGHT: 2000,
  ARENA_SHAPE: "hexagon", // "circle" or "hexagon"
  
  // Player settings
  PLAYER_RADIUS: 20,
  MAX_SPEED: 5,
  BASE_GRAVITY_STRENGTH: 450, // Increased from 200 for more noticeable gravity effect
  GRAVITY_RANGE: 200, // Increased from 150 for wider area of effect
  PULSE_STRENGTH_MULTIPLIER: 8, // Increased from 5 for more dramatic pulse
  PULSE_DURATION: 1000, // ms
  PULSE_COOLDOWN: 10000, // ms
  PULSE_ENERGY_COST: 20,
  COLLAPSE_STRENGTH_MULTIPLIER: 15, // Increased from 10 for more dramatic collapse
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
  BLACK_HOLE_STRENGTH: 600, // Increased from 400 for stronger black holes
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
  
  // Calculate distance between two points
  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  // Determine if a player is in a gravity well
  isInGravityWell(player1, player2) {
    const dist = this.distance(player1.x, player1.y, player2.x, player2.y);
    return dist <= GAME_CONSTANTS.GRAVITY_RANGE;
  }
  
  // Handle player tagging
  handleTagging(room) {
    const now = Date.now();
    const players = Object.values(room.players);
    
    for (const player of players) {
      // Skip tagged players or those with invulnerability
      if (player.isTagged || now - player.lastTaggedTime < GAME_CONSTANTS.TAG_INVULNERABILITY) {
        continue;
      }
      
      for (const otherPlayer of players) {
        // Skip self or tagged players
        if (player.id === otherPlayer.id || otherPlayer.isTagged) {
          continue;
        }
        
        const dist = this.distance(player.x, player.y, otherPlayer.x, otherPlayer.y);
        
        // Check if in tagging range
        if (dist <= GAME_CONSTANTS.TAG_RADIUS) {
          // Tag the player
          player.isTagged = true;
          player.lastTaggedTime = now;
          player.score -= GAME_CONSTANTS.TAGGED_POINTS_LOST;
          otherPlayer.score += GAME_CONSTANTS.TAG_POINTS;
          break;
        }
      }
    }
    
    // Check if only one player is untagged
    const untaggedPlayers = players.filter(p => !p.isTagged);
    if (untaggedPlayers.length === 1 && players.length > 1) {
      const lastUntagged = untaggedPlayers[0];
      if (!lastUntagged.wasLastUntagged) {
        lastUntagged.wasLastUntagged = true;
        lastUntagged.score += 10; // Bonus for being last untagged
      }
    }
  }
  
  // Apply gravity effects between players
  applyGravity(room) {
    const players = Object.values(room.players);
    
    for (const player of players) {
      // Calculate how long the player has been standing still
      const stillTime = Date.now() - player.lastMoveTime;
      const stillnessMultiplier = Math.min(4, 1 + stillTime / 800); // Increased to max 4x after 2.4 seconds (was 3x after 2 seconds)
      
      // Base gravity strength with stillness multiplier
      let gravityStrength = GAME_CONSTANTS.BASE_GRAVITY_STRENGTH * stillnessMultiplier;
      
      // Apply pulse multiplier if active
      if (player.isPulsing) {
        const pulseElapsed = Date.now() - player.pulseStartTime;
        if (pulseElapsed <= GAME_CONSTANTS.PULSE_DURATION) {
          gravityStrength *= GAME_CONSTANTS.PULSE_STRENGTH_MULTIPLIER;
        } else {
          player.isPulsing = false;
        }
      }
      
      // Apply collapse effect if active
      if (player.isCollapsing) {
        const collapseElapsed = Date.now() - player.collapseStartTime;
        if (collapseElapsed <= GAME_CONSTANTS.COLLAPSE_DURATION) {
          if (collapseElapsed < GAME_CONSTANTS.COLLAPSE_DURATION / 2) {
            // First half: gravity decreases - less drastic reduction for visual perception
            gravityStrength *= (1 - collapseElapsed / (GAME_CONSTANTS.COLLAPSE_DURATION / 1.5));
          } else {
            // Second half: gravity explodes - more dramatic explosion
            const explosionPhase = (collapseElapsed - GAME_CONSTANTS.COLLAPSE_DURATION / 2) / (GAME_CONSTANTS.COLLAPSE_DURATION / 2);
            gravityStrength *= GAME_CONSTANTS.COLLAPSE_STRENGTH_MULTIPLIER * explosionPhase * 1.5; // 50% more explosive
          }
        } else {
          player.isCollapsing = false;
        }
      }
      
      // Store final gravity strength
      player.gravityStrength = gravityStrength;
    }
    
    // Now apply the gravity effects between players
    for (const player of players) {
      for (const otherPlayer of players) {
        if (player.id === otherPlayer.id) continue;
        
        const dist = this.distance(player.x, player.y, otherPlayer.x, otherPlayer.y);
        
        // Apply gravity if within range - increased range for better visibility
        if (dist < GAME_CONSTANTS.GRAVITY_RANGE && dist > 0) {
          // Calculate gravity force with enhanced inverse square law (1.5 power instead of 2)
          // This makes gravity stronger at medium distances but still decreases with distance
          let force = otherPlayer.gravityStrength / Math.pow(dist, 1.5);
          
          // Apply minimum force threshold to make gravity more perceptible
          force = Math.max(force, 0.5);
          
          // Check if either player is in a nebula
          for (const hazard of room.hazards) {
            if (hazard.type === 'nebula') {
              const playerInNebula = this.distance(player.x, player.y, hazard.x, hazard.y) <= hazard.radius;
              const otherInNebula = this.distance(otherPlayer.x, otherPlayer.y, hazard.x, hazard.y) <= hazard.radius;
              
              if (playerInNebula || otherInNebula) {
                force *= hazard.gravityModifier;
              }
            }
          }
          
          // Direction vector
          const dx = (otherPlayer.x - player.x) / dist;
          const dy = (otherPlayer.y - player.y) / dist;
          
          // Apply force to velocity with increased tick multiplier for more immediate feedback
          const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 800; // Increased from 1000 for stronger per-tick effect
          player.velocityX += dx * force * tickMultiplier;
          player.velocityY += dy * force * tickMultiplier;
        }
      }
    }
  }
  
  // Apply black hole effects
  applyBlackHoles(room) {
    const players = Object.values(room.players);
    
    for (const player of players) {
      for (const hazard of room.hazards) {
        if (hazard.type === 'blackHole') {
          const dist = this.distance(player.x, player.y, hazard.x, hazard.y);
          
          // Apply gravity pull - enhanced formula for more dramatic effect
          if (dist > 0) {
            // Stronger pull for closer objects (power of 1.5 instead of 2)
            const force = hazard.strength / Math.pow(dist, 1.5);
            const dx = (hazard.x - player.x) / dist;
            const dy = (hazard.y - player.y) / dist;
            
            // Apply increased force for more dramatic pull
            const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 800; // Enhanced for stronger effect
            player.velocityX += dx * force * tickMultiplier;
            player.velocityY += dy * force * tickMultiplier;
          }
          
          // Check if player fell into black hole
          if (dist <= hazard.radius) {
            // Apply penalty
            player.score -= GAME_CONSTANTS.BLACK_HOLE_PENALTY;
            
            // Respawn player at random position
            player.x = Math.random() * GAME_CONSTANTS.ARENA_WIDTH;
            player.y = Math.random() * GAME_CONSTANTS.ARENA_HEIGHT;
            player.velocityX = 0;
            player.velocityY = 0;
            player.isTagged = true;
            player.lastTaggedTime = Date.now();
          }
        }
      }
    }
  }
  
  // Update comet positions and handle collisions
  updateComets(room) {
    const now = Date.now();
    
    // Spawn new comets periodically
    if (now - room.lastCometSpawn >= GAME_CONSTANTS.COMET_SPAWN_INTERVAL) {
      room.hazards.push(createComet());
      room.lastCometSpawn = now;
    }
    
    // Update existing comets
    for (let i = room.hazards.length - 1; i >= 0; i--) {
      const hazard = room.hazards[i];
      
      if (hazard.type === 'comet') {
        // Move comet
        hazard.x += hazard.velocityX;
        hazard.y += hazard.velocityY;
        
        // Check if comet is out of bounds
        if (
          hazard.x < 0 || hazard.x > GAME_CONSTANTS.ARENA_WIDTH ||
          hazard.y < 0 || hazard.y > GAME_CONSTANTS.ARENA_HEIGHT
        ) {
          // Remove comet
          room.hazards.splice(i, 1);
          continue;
        }
        
        // Check for player collisions
        for (const player of Object.values(room.players)) {
          const dist = this.distance(player.x, player.y, hazard.x, hazard.y);
          
          if (dist <= GAME_CONSTANTS.PLAYER_RADIUS + hazard.radius) {
            // Stronger nudge for more dramatic comet impact
            player.velocityX += hazard.velocityX * 1.5; // 50% stronger impact
            player.velocityY += hazard.velocityY * 1.5;
          }
        }
      }
    }
  }
  
  // Apply player movement based on input and velocity
  applyMovement(room) {
    for (const player of Object.values(room.players)) {
      // Apply player movement direction
      if (player.movementDirection.x !== 0 || player.movementDirection.y !== 0) {
        player.velocityX += player.movementDirection.x * 0.5;
        player.velocityY += player.movementDirection.y * 0.5;
      }
      
      // Apply slightly less damping for more continuous motion
      player.velocityX *= 0.96; // Changed from 0.95 for less friction
      player.velocityY *= 0.96;
      
      // Limit max speed
      const speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
      if (speed > GAME_CONSTANTS.MAX_SPEED) {
        player.velocityX = (player.velocityX / speed) * GAME_CONSTANTS.MAX_SPEED;
        player.velocityY = (player.velocityY / speed) * GAME_CONSTANTS.MAX_SPEED;
      }
      
      // Update position
      player.x += player.velocityX;
      player.y += player.velocityY;
      
      // Wrap around edges
      if (player.x < 0) player.x = GAME_CONSTANTS.ARENA_WIDTH;
      if (player.x > GAME_CONSTANTS.ARENA_WIDTH) player.x = 0;
      if (player.y < 0) player.y = GAME_CONSTANTS.ARENA_HEIGHT;
      if (player.y > GAME_CONSTANTS.ARENA_HEIGHT) player.y = 0;
    }
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
      
      // Apply movement
      this.applyMovement(room);
      
      // Apply gravity between players
      this.applyGravity(room);
      
      // Apply black hole effects
      this.applyBlackHoles(room);
      
      // Update comets
      this.updateComets(room);
      
      // Handle tagging
      this.handleTagging(room);
      
      // Regenerate energy
      this.regenerateEnergy(room);
      
      // Stronger gravity during storm for more dramatic effects
      if (inGravityStorm) {
        for (const player of Object.values(room.players)) {
          player.gravityStrength *= 3; // Increased from 2x to 3x for more dramatic storm
        }
      }
      
      // Check if round is over
      if (room.timeRemaining === 0) {
        // Reset the round
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
    });
  }
}

module.exports = {
  GameManager,
  GAME_CONSTANTS,
  createPlayer,
  createBlackHole,
  createNebula,
  createComet
};