const { GAME_CONSTANTS } = require('./constants');

// Physics utility functions
class Physics {
  // Calculate distance between two points
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  // Determine if a player is in a gravity well
  static isInGravityWell(player1, player2) {
    const dist = this.distance(player1.x, player1.y, player2.x, player2.y);
    return dist <= GAME_CONSTANTS.GRAVITY_RANGE;
  }
  
  // Apply gravity effects between players
  static applyGravity(room) {
    const players = Object.values(room.players);
    
    // First, calculate gravity strength for each player
    for (const player of players) {
      // Calculate how long the player has been standing still
      const stillTime = Date.now() - player.lastMoveTime;
      const stillnessMultiplier = Math.min(4, 1 + stillTime / 800);
      
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
            // First half: gravity decreases
            gravityStrength *= (1 - collapseElapsed / (GAME_CONSTANTS.COLLAPSE_DURATION / 1.5));
          } else {
            // Second half: gravity explodes
            const explosionPhase = (collapseElapsed - GAME_CONSTANTS.COLLAPSE_DURATION / 2) / (GAME_CONSTANTS.COLLAPSE_DURATION / 2);
            gravityStrength *= GAME_CONSTANTS.COLLAPSE_STRENGTH_MULTIPLIER * explosionPhase * 1.5;
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
        
        // Apply gravity if within range
        if (dist < GAME_CONSTANTS.GRAVITY_RANGE && dist > 0) {
          // Calculate gravity force with enhanced inverse square law
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
          
          // Apply force to velocity
          const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 800;
          player.velocityX += dx * force * tickMultiplier;
          player.velocityY += dy * force * tickMultiplier;
        }
      }
    }
  }
  
  // Apply black hole effects
  static applyBlackHoles(room) {
    const players = Object.values(room.players);
    
    for (const player of players) {
      for (const hazard of room.hazards) {
        if (hazard.type === 'blackHole') {
          const dist = this.distance(player.x, player.y, hazard.x, hazard.y);
          
          // Apply gravity pull
          if (dist > 0) {
            const force = hazard.strength / Math.pow(dist, 1.5);
            const dx = (hazard.x - player.x) / dist;
            const dy = (hazard.y - player.y) / dist;
            
            const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 800;
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
  
  // Apply player movement based on input and velocity
  static applyMovement(room) {
    for (const player of Object.values(room.players)) {
      // Apply player movement direction
      if (player.movementDirection.x !== 0 || player.movementDirection.y !== 0) {
        player.velocityX += player.movementDirection.x * 0.5;
        player.velocityY += player.movementDirection.y * 0.5;
      }
      
      // Apply damping to simulate friction
      player.velocityX *= 0.96;
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
}

module.exports = Physics;
