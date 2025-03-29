const { GAME_CONSTANTS } = require('../constants');

// Core physics utility functions
class PhysicsCore {
  // Calculate distance between two points
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  // Determine if a player is in a gravity well
  static isInGravityWell(player1, player2) {
    const dist = this.distance(player1.x, player1.y, player2.x, player2.y);
    return dist <= GAME_CONSTANTS.GRAVITY_RANGE;
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

module.exports = PhysicsCore;
