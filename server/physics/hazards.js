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
  
  // Check if player is within nebula effect
  static isInNebula(player, hazard) {
    return PhysicsCore.distance(player.x, player.y, hazard.x, hazard.y) <= hazard.radius;
  }
  
  // Move hazards slowly across the map
  static moveHazards(room) {
    for (const hazard of room.hazards) {
      if (hazard.type === 'blackHole') {
        // Generate a random direction change occasionally
        if (Math.random() < 0.01) {
          hazard.directionX = Math.random() * 2 - 1;
          hazard.directionY = Math.random() * 2 - 1;
          
          // Normalize direction vector
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
        }
        
        // If the hazard doesn't have a direction yet, initialize it
        if (!hazard.directionX) {
          hazard.directionX = Math.random() * 2 - 1;
          hazard.directionY = Math.random() * 2 - 1;
          
          // Normalize direction vector
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
        }
        
        // Move the black hole
        hazard.x += hazard.directionX * GAME_CONSTANTS.BLACK_HOLE_MOVE_SPEED;
        hazard.y += hazard.directionY * GAME_CONSTANTS.BLACK_HOLE_MOVE_SPEED;
        
        // Bounce off walls
        if (hazard.x < hazard.radius || hazard.x > GAME_CONSTANTS.ARENA_WIDTH - hazard.radius) {
          hazard.directionX *= -1;
        }
        if (hazard.y < hazard.radius || hazard.y > GAME_CONSTANTS.ARENA_HEIGHT - hazard.radius) {
          hazard.directionY *= -1;
        }
      }
      else if (hazard.type === 'nebula') {
        // Generate a random direction change occasionally
        if (Math.random() < 0.005) {
          hazard.directionX = Math.random() * 2 - 1;
          hazard.directionY = Math.random() * 2 - 1;
          
          // Normalize direction vector
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
        }
        
        // If the hazard doesn't have a direction yet, initialize it
        if (!hazard.directionX) {
          hazard.directionX = Math.random() * 2 - 1;
          hazard.directionY = Math.random() * 2 - 1;
          
          // Normalize direction vector
          const magnitude = Math.sqrt(hazard.directionX * hazard.directionX + hazard.directionY * hazard.directionY);
          hazard.directionX /= magnitude;
          hazard.directionY /= magnitude;
        }
        
        // Move the nebula
        hazard.x += hazard.directionX * GAME_CONSTANTS.NEBULA_MOVE_SPEED;
        hazard.y += hazard.directionY * GAME_CONSTANTS.NEBULA_MOVE_SPEED;
        
        // Bounce off walls
        if (hazard.x < hazard.radius || hazard.x > GAME_CONSTANTS.ARENA_WIDTH - hazard.radius) {
          hazard.directionX *= -1;
        }
        if (hazard.y < hazard.radius || hazard.y > GAME_CONSTANTS.ARENA_HEIGHT - hazard.radius) {
          hazard.directionY *= -1;
        }
      }
    }
  }
}

module.exports = HazardPhysics;
