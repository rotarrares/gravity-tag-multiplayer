const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');

// Gravity physics system
class GravityPhysics {
  // Calculate player's gravity strength based on state
  static calculatePlayerGravityStrength(player) {
    // Calculate how long the player has been standing still
    const stillTime = Date.now() - player.lastMoveTime;
    const stillnessMultiplier = Math.min(4.5, 1 + stillTime / 800); // Increased max multiplier and faster buildup
    
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
          // First half: gravity decreases more dramatically
          gravityStrength *= (1 - collapseElapsed / (GAME_CONSTANTS.COLLAPSE_DURATION / 2.0));
        } else {
          // Second half: gravity explodes with much more force
          const explosionPhase = (collapseElapsed - GAME_CONSTANTS.COLLAPSE_DURATION / 2) / (GAME_CONSTANTS.COLLAPSE_DURATION / 2);
          gravityStrength *= GAME_CONSTANTS.COLLAPSE_STRENGTH_MULTIPLIER * explosionPhase * 2.5; // Increased intensity
        }
      } else {
        player.isCollapsing = false;
      }
    }
    
    return gravityStrength;
  }
  
  // Apply force between two objects
  static applyGravityForce(player, otherPlayer, dist, room) {
    // If players are extremely close, nullify gravity to prevent sticking together
    if (dist < GAME_CONSTANTS.GRAVITY_PROXIMITY_THRESHOLD) {
      return 0;
    }
    
    // Calculate gravity force - now with more extreme effect
    // Use power 1.8 instead of 2.0 for stronger long-range gravitational pull
    let force = otherPlayer.gravityStrength / Math.pow(dist, 1.8);
    
    // Apply a larger minimum force for stronger gravity wells
    force = Math.max(force, 0.25); // Increased from 0.15 for stronger minimum effect
    
    // Apply distance attenuation - strongest at center, weaker at edges
    // Modified for more impactful gravity at range
    const distanceFactor = 1 - (dist / GAME_CONSTANTS.GRAVITY_RANGE);
    force *= Math.pow(distanceFactor, 0.4); // Gentler falloff curve (0.4 instead of 0.5)
    
    // Check if either player is in a nebula
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
  
  // Apply gravity effects between players
  static applyGravity(room) {
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
            const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 850; // Increased from 1000 to 850 for stronger effect
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
