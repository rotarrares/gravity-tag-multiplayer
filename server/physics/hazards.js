const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');

// Physics for hazard interactions
class HazardPhysics {
  // Apply black hole effects
  static applyBlackHoles(room) {
    const players = Object.values(room.players);
    
    for (const player of players) {
      for (const hazard of room.hazards) {
        if (hazard.type === 'blackHole') {
          const dist = PhysicsCore.distance(player.x, player.y, hazard.x, hazard.y);
          
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
    player.velocityX += comet.velocityX * 1.5;
    player.velocityY += comet.velocityY * 1.5;
  }
  
  // Check if player is within nebula effect
  static isInNebula(player, hazard) {
    return PhysicsCore.distance(player.x, player.y, hazard.x, hazard.y) <= hazard.radius;
  }
}

module.exports = HazardPhysics;
