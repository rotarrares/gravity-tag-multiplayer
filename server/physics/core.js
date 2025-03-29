const { GAME_CONSTANTS } = require('../constants');

// Core physics utility functions
class PhysicsCore {
  // Calculate distance between two points
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  // Calculate squared distance (faster when only comparing distances)
  static distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }
  
  // Determine if a player is in a gravity well using squared distance
  static isInGravityWell(player1, player2) {
    const distSquared = this.distanceSquared(player1.x, player1.y, player2.x, player2.y);
    return distSquared <= GAME_CONSTANTS.GRAVITY_RANGE * GAME_CONSTANTS.GRAVITY_RANGE;
  }
  
  // Apply player movement based on input and velocity
  static applyMovement(room) {
    // Object pool for reusable calculations
    const playerCount = Object.keys(room.players).length;
    
    // Local constants for better performance
    const arenaWidth = GAME_CONSTANTS.ARENA_WIDTH;
    const arenaHeight = GAME_CONSTANTS.ARENA_HEIGHT;
    const maxSpeed = GAME_CONSTANTS.MAX_SPEED;
    
    // Movement damping factor (precomputed)
    const damping = 0.96;
    
    for (const player of Object.values(room.players)) {
      // Apply player movement direction
      if (player.movementDirection.x !== 0 || player.movementDirection.y !== 0) {
        player.velocityX += player.movementDirection.x * 0.5;
        player.velocityY += player.movementDirection.y * 0.5;
      }
      
      // Apply damping to simulate friction
      player.velocityX *= damping;
      player.velocityY *= damping;
      
      // Limit max speed - check squared speed first (avoids sqrt calculation)
      const speedSquared = player.velocityX * player.velocityX + player.velocityY * player.velocityY;
      const maxSpeedSquared = maxSpeed * maxSpeed;
      
      if (speedSquared > maxSpeedSquared) {
        // Only calculate sqrt when needed
        const speed = Math.sqrt(speedSquared);
        const speedFactor = maxSpeed / speed;
        player.velocityX *= speedFactor;
        player.velocityY *= speedFactor;
      }
      
      // Update position
      player.x += player.velocityX;
      player.y += player.velocityY;
      
      // Wrap around edges (modified for continuous movement)
      if (player.x < 0) player.x += arenaWidth;
      if (player.x > arenaWidth) player.x -= arenaWidth;
      if (player.y < 0) player.y += arenaHeight;
      if (player.y > arenaHeight) player.y -= arenaHeight;
    }
  }
}

module.exports = PhysicsCore;
