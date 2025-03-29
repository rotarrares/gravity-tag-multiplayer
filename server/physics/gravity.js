const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');

// Gravity physics system
class GravityPhysics {
  // Calculate player's gravity strength based on state
  static calculatePlayerGravityStrength(player) {
    // Calculate how long the player has been standing still
    const stillTime = Date.now() - player.lastMoveTime;
    const stillnessMultiplier = Math.min(3.5, 1 + stillTime / 1000);
    
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
    
    return gravityStrength;
  }
  
  // Apply force between two objects
  static applyGravityForce(player, otherPlayer, dist, room) {
    // Calculate gravity force - now with more extreme falloff for the larger range
    // Use power 2.0 instead of 1.8 to reduce the effect of distant gravity
    let force = otherPlayer.gravityStrength / Math.pow(dist, 2.0);
    
    // Apply a smaller minimum force for the larger range
    force = Math.max(force, 0.15); // Reduced from 0.25 for very distant players
    
    // Apply distance attenuation - strongest at center, weaker at edges
    // Modified for the much larger range - more gradual falloff
    const distanceFactor = 1 - (dist / GAME_CONSTANTS.GRAVITY_RANGE);
    force *= Math.pow(distanceFactor, 0.5); // Gentler falloff curve (0.5 instead of 0.7)
    
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
          // Calculate and apply force
          const force = this.applyGravityForce(player, otherPlayer, dist, room);
          
          // Direction vector
          const dx = (otherPlayer.x - player.x) / dist;
          const dy = (otherPlayer.y - player.y) / dist;
          
          // Apply force to velocity with reduced tick multiplier for larger range
          const tickMultiplier = GAME_CONSTANTS.TICK_RATE / 1000; // Further reduced from 900 to 1000
          player.velocityX += dx * force * tickMultiplier;
          player.velocityY += dy * force * tickMultiplier;
        }
      }
    }
  }
}

module.exports = GravityPhysics;
