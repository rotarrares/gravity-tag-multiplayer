const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');
const SpatialGrid = require('./spatial');

// Physics for hazard interactions
class HazardPhysics {
  // Apply black hole effects using spatial partitioning
  static applyBlackHolesWithSpatial(room) {
    const players = Object.values(room.players);
    const blackHoles = room.hazards.filter(hazard => hazard.type === 'blackHole');
    
    // Precompute some constants to avoid division in the loop
    const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 600;
    
    for (const player of players) {
      // Only check black holes within the gravity range
      const nearbyBlackHoles = room.spatialGrid.getObjectsInRadius(
        player.x, player.y, GAME_CONSTANTS.GRAVITY_RANGE * 1.5 // Add a buffer for black holes
      ).filter(obj => obj.type === 'blackHole');
      
      for (const blackHole of nearbyBlackHoles) {
        const dx = blackHole.x - player.x;
        const dy = blackHole.y - player.y;
        const distSquared = dx * dx + dy * dy;
        const dist = Math.sqrt(distSquared);
        
        // Apply gravity pull - stronger effect with lower power for wider area of effect
        if (dist > 0) {
          // Fast approximation for power calculation
          const invDist = 1 / (dist * Math.sqrt(dist) * 0.6); // Approximation of 1/dist^1.3
          const force = blackHole.strength * invDist;
          
          // Avoid normalizing when we already have dx and dy
          const normalizeFactor = 1 / dist;
          const normalizedDx = dx * normalizeFactor;
          const normalizedDy = dy * normalizeFactor;
          
          player.velocityX += normalizedDx * force * tickMultiplier;
          player.velocityY += normalizedDy * force * tickMultiplier;
        }
        
        // Check if player fell into black hole
        if (dist <= blackHole.radius) {
          this.handleBlackHoleCollision(player);
        }
      }
    }
  }
  
  // Original method kept for backward compatibility
  static applyBlackHoles(room) {
    // If we have a spatial grid, use that method instead
    if (room.spatialGrid) {
      return this.applyBlackHolesWithSpatial(room);
    }
    
    const players = Object.values(room.players);
    
    for (const player of players) {
      for (const hazard of room.hazards) {
        if (hazard.type === 'blackHole') {
          const dist = PhysicsCore.distance(player.x, player.y, hazard.x, hazard.y);
          
          // Apply gravity pull - stronger effect with lower power for wider area of effect
          if (dist > 0) {
            const force = hazard.strength / Math.pow(dist, 1.3); // Decreased from 1.5 for stronger pull
            const dx = (hazard.x - player.x) / dist;
            const dy = (hazard.y - player.y) / dist;
            
            const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 600; // Increased from 800 for stronger pull
            player.velocityX += dx * force * tickMultiplier;
            player.velocityY += dy * force * tickMultiplier;
          }
          
          // Check if player fell into black hole
          if (dist <= hazard.radius) {
            this.handleBlackHoleCollision(player);
          }
        }
      }
    }
  }
  
  // Handle when a player falls into a black hole
  static handleBlackHoleCollision(player) {
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
  
  // Apply comet collision effects
  static handleCometCollision(player, comet) {
    // Stronger nudge for more dramatic comet impact
    player.velocityX += comet.velocityX * 2.0; // Increased from 1.5
    player.velocityY += comet.velocityY * 2.0; // Increased from 1.5
  }
  
  // Check if player is within nebula effect - optimized with squared distance
  static isInNebula(player, hazard) {
    // Use squared distance instead of calculating the square root
    const dx = player.x - hazard.x;
    const dy = player.y - hazard.y;
    const distSquared = dx * dx + dy * dy;
    return distSquared <= hazard.radius * hazard.radius;
  }
  
  // Move hazards across the map with more dynamic and unpredictable patterns
  static moveHazards(room) {
    const now = Date.now();
    
    for (const hazard of room.hazards) {
      if (hazard.type === 'blackHole' || hazard.type === 'nebula') {
        // Determine movement speed based on hazard type
        const moveSpeed = hazard.type === 'blackHole' ? 
          GAME_CONSTANTS.BLACK_HOLE_MOVE_SPEED : 
          GAME_CONSTANTS.NEBULA_MOVE_SPEED;
        
        // Initialize hazard-specific properties if not present
        if (!hazard.lastDirectionChange) {
          hazard.lastDirectionChange = now;
          hazard.directionChangeInterval = 3000 + Math.random() * 4000; // 3-7 seconds
        }
        
        // More frequent random direction changes
        const randomChance = hazard.type === 'blackHole' ? 0.03 : 0.02; // Increased from 0.01/0.005
        
        // Check if it's time for a scheduled direction change
        const timeForChange = now - hazard.lastDirectionChange > hazard.directionChangeInterval;
        
        if (Math.random() < randomChance || timeForChange) {
          // Generate new direction with bias toward the current direction (for smoother changes)
          if (hazard.directionX && hazard.directionY) {
            // Add some variation while keeping general direction
            hazard.directionX += (Math.random() * 0.6 - 0.3); // -0.3 to +0.3 change
            hazard.directionY += (Math.random() * 0.6 - 0.3);
          } else {
            // First initialization or complete change
            hazard.directionX = Math.random() * 2 - 1;
            hazard.directionY = Math.random() * 2 - 1;
          }
          
          // Normalize direction vector for consistent speed
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
          
          // Update timing info
          hazard.lastDirectionChange = now;
          // Randomize the next change interval (2-6 seconds)
          hazard.directionChangeInterval = 2000 + Math.random() * 4000;
        }
        
        // Move the hazard with the current direction and speed
        hazard.x += hazard.directionX * moveSpeed;
        hazard.y += hazard.directionY * moveSpeed;
        
        // Bounce off walls with slight direction variation for more natural movement
        if (hazard.x < hazard.radius || hazard.x > GAME_CONSTANTS.ARENA_WIDTH - hazard.radius) {
          hazard.directionX *= -1;
          // Add a small y-direction change for more varied bounces
          hazard.directionY += (Math.random() * 0.4 - 0.2);
          
          // Normalize direction after changes
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
        }
        
        if (hazard.y < hazard.radius || hazard.y > GAME_CONSTANTS.ARENA_HEIGHT - hazard.radius) {
          hazard.directionY *= -1;
          // Add a small x-direction change for more varied bounces
          hazard.directionX += (Math.random() * 0.4 - 0.2);
          
          // Normalize direction after changes
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
        }
      }
    }
  }
}

module.exports = HazardPhysics;
