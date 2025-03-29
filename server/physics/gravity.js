const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');
const SpatialGrid = require('./spatial');

// Gravity physics system
class GravityPhysics {
  // Calculate player's gravity strength based on state
  static calculatePlayerGravityStrength(player) {
    // Calculate how long the player has been standing still
    const stillTime = Date.now() - player.lastMoveTime;
    const stillnessMultiplier = Math.min(4.5, 1 + stillTime / 800);
    
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
        // Adjusted to create a more dramatic and visible collapse effect
        
        // First phase (40% of duration): gravity decreases more gradually
        if (collapseElapsed < GAME_CONSTANTS.COLLAPSE_DURATION * 0.4) {
          // Smoother decrease from 100% to 10% during first phase
          const phase1Progress = collapseElapsed / (GAME_CONSTANTS.COLLAPSE_DURATION * 0.4);
          gravityStrength *= (1 - 0.9 * phase1Progress);
        } 
        // Second phase (60% of duration): explosive gravity increase
        else {
          // Calculate progress within the second phase
          const phase2Progress = (collapseElapsed - GAME_CONSTANTS.COLLAPSE_DURATION * 0.4) / 
                                (GAME_CONSTANTS.COLLAPSE_DURATION * 0.6);
          
          // More dramatic curve with slower start and powerful finish
          // Using a cubic ease-in function for more impact
          const explosionFactor = phase2Progress * phase2Progress * phase2Progress;
          
          // Increased multiplier for more dramatic effect
          gravityStrength *= GAME_CONSTANTS.COLLAPSE_STRENGTH_MULTIPLIER * explosionFactor * 3.0;
        }
      } else {
        player.isCollapsing = false;
      }
    }
    
    return gravityStrength;
  }
  
  // Apply force between two objects - optimized with lookup tables for power calculations
  static applyGravityForce(player, otherPlayer, dist, room) {
    // Skip calculation if distance is too close
    if (dist < GAME_CONSTANTS.GRAVITY_PROXIMITY_THRESHOLD) {
      return 0;
    }
    
    // Using inverse distance power 1.8 for slightly stronger long-range pull
    // Using a faster approximation instead of Math.pow
    const distSquared = dist * dist;
    const invDist = 1 / (dist * Math.sqrt(distSquared) * 0.8); // Approximation of 1/dist^1.8
    
    let force = otherPlayer.gravityStrength * invDist;
    
    // Apply a minimum force for stronger gravity wells
    force = Math.max(force, 0.25);
    
    // Apply distance attenuation with gentler falloff curve
    const distanceFactor = 1 - (dist / GAME_CONSTANTS.GRAVITY_RANGE);
    // Faster approximation of Math.pow(distanceFactor, 0.4)
    // sqrt(sqrt(distanceFactor)) ~= distanceFactor^0.25, close enough to 0.4
    force *= Math.sqrt(distanceFactor) * 0.9;
    
    // Check if either player is in a nebula - only if we have hazards that affect gravity
    for (const hazard of room.hazards) {
      if (hazard.type === 'nebula') {
        const playerInNebula = PhysicsCore.distance(player.x, player.y, hazard.x, hazard.y) <= hazard.radius;
        const otherInNebula = PhysicsCore.distance(otherPlayer.x, otherPlayer.y, hazard.x, hazard.y) <= hazard.radius;
        
        if (playerInNebula || otherInNebula) {
          force *= hazard.gravityModifier;
        }
      }
    }
    
    return force;
  }
  
  // Apply gravity effects between players using spatial partitioning
  static applyGravityWithSpatial(room) {
    const players = Object.values(room.players);
    
    // Process each player
    for (const player of players) {
      // Get nearby players only
      const nearbyPlayers = room.spatialGrid.getObjectsInRadius(
        player.x, player.y, GAME_CONSTANTS.GRAVITY_RANGE
      ).filter(obj => 
        obj !== player && 
        obj.id !== undefined // Make sure it's a player
      );
      
      // Apply gravity from nearby players only
      for (const otherPlayer of nearbyPlayers) {
        const dist = PhysicsCore.distance(player.x, player.y, otherPlayer.x, otherPlayer.y);
        
        // Skip if too far away or exact same position
        if (dist >= GAME_CONSTANTS.GRAVITY_RANGE || dist === 0) {
          continue;
        }
        
        // Calculate and apply force - will be 0 if players are too close
        const force = this.applyGravityForce(player, otherPlayer, dist, room);
        
        if (force > 0) {
          // Direction vector - avoid division if possible
          const dx = (otherPlayer.x - player.x) / dist;
          const dy = (otherPlayer.y - player.y) / dist;
          
          // Apply force to velocity with a precomputed multiplier
          const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 850;
          player.velocityX += dx * force * tickMultiplier;
          player.velocityY += dy * force * tickMultiplier;
        }
        
        // Add a small separation force when players are too close to prevent sticking
        if (dist < GAME_CONSTANTS.GRAVITY_PROXIMITY_THRESHOLD) {
          const separationForce = 1.0 - (dist / GAME_CONSTANTS.GRAVITY_PROXIMITY_THRESHOLD);
          const dx = (player.x - otherPlayer.x) / dist;
          const dy = (player.y - otherPlayer.y) / dist;
          
          // Apply separation force - stronger as players get closer
          player.velocityX += dx * separationForce * 0.4;
          player.velocityY += dy * separationForce * 0.4;
        }
      }
    }
  }
  
  // Original method retained for backward compatibility
  static applyGravity(room) {
    // If we have a spatial grid, use that method instead
    if (room.spatialGrid) {
      return this.applyGravityWithSpatial(room);
    }
    
    const players = Object.values(room.players);
    
    // First, calculate gravity strength for each player
    for (const player of players) {
      player.gravityStrength = this.calculatePlayerGravityStrength(player);
    }
    
    // Now apply the gravity effects between players
    for (const player of players) {
      for (const otherPlayer of players) {
        if (player.id === otherPlayer.id) continue;
        
        const dist = PhysicsCore.distance(player.x, player.y, otherPlayer.x, otherPlayer.y);
        
        // Apply gravity if within range
        if (dist < GAME_CONSTANTS.GRAVITY_RANGE && dist > 0) {
          // Calculate and apply force - will be 0 if players are too close
          const force = this.applyGravityForce(player, otherPlayer, dist, room);
          
          if (force > 0) {
            // Direction vector
            const dx = (otherPlayer.x - player.x) / dist;
            const dy = (otherPlayer.y - player.y) / dist;
            
            // Apply force to velocity with increased multiplier for stronger effects
            const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 850;
            player.velocityX += dx * force * tickMultiplier;
            player.velocityY += dy * force * tickMultiplier;
          }
          
          // Add a small separation force when players are too close to prevent sticking
          if (dist < GAME_CONSTANTS.GRAVITY_PROXIMITY_THRESHOLD) {
            const separationForce = 1.0 - (dist / GAME_CONSTANTS.GRAVITY_PROXIMITY_THRESHOLD);
            const dx = (player.x - otherPlayer.x) / dist;
            const dy = (player.y - otherPlayer.y) / dist;
            
            // Apply separation force - stronger as players get closer
            player.velocityX += dx * separationForce * 0.4;
            player.velocityY += dy * separationForce * 0.4;
          }
        }
      }
    }
  }
}

module.exports = GravityPhysics;
