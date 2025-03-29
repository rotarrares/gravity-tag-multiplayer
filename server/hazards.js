const Physics = require('./physics');
const { GAME_CONSTANTS } = require('./constants');

class HazardManager {
  // Update comet positions and handle collisions
  static updateComets(room) {
    const now = Date.now();
    
    // Spawn new comets periodically
    if (now - room.lastCometSpawn >= GAME_CONSTANTS.COMET_SPAWN_INTERVAL) {
      const createComet = require('./entities').createComet; // Import here to avoid circular dependency
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
          const dist = Physics.distance(player.x, player.y, hazard.x, hazard.y);
          
          if (dist <= GAME_CONSTANTS.PLAYER_RADIUS + hazard.radius) {
            // Stronger nudge for more dramatic comet impact
            player.velocityX += hazard.velocityX * 1.5;
            player.velocityY += hazard.velocityY * 1.5;
          }
        }
      }
    }
  }
}

module.exports = HazardManager;
