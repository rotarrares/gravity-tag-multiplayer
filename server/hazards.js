const Physics = require('./physics');
const { GAME_CONSTANTS } = require('./constants');
const { createComet, releaseComet } = require('./entities');

class HazardManager {
  // Update comet positions and handle collisions
  static updateComets(room) {
    const now = Date.now();
    
    // Spawn new comets periodically
    if (now - room.lastCometSpawn >= GAME_CONSTANTS.COMET_SPAWN_INTERVAL) {
      room.hazards.push(createComet());
      room.lastCometSpawn = now;
    }
    
    // Cache constants for better performance
    const arenaWidth = GAME_CONSTANTS.ARENA_WIDTH;
    const arenaHeight = GAME_CONSTANTS.ARENA_HEIGHT;
    const playerRadius = GAME_CONSTANTS.PLAYER_RADIUS;
    
    // Update existing comets
    for (let i = room.hazards.length - 1; i >= 0; i--) {
      const hazard = room.hazards[i];
      
      if (hazard.type === 'comet') {
        // Move comet
        hazard.x += hazard.velocityX;
        hazard.y += hazard.velocityY;
        
        // Check if comet is out of bounds
        if (
          hazard.x < -hazard.radius || hazard.x > arenaWidth + hazard.radius ||
          hazard.y < -hazard.radius || hazard.y > arenaHeight + hazard.radius
        ) {
          // Remove comet and return it to pool
          const removedComet = room.hazards.splice(i, 1)[0];
          releaseComet(removedComet);
          continue;
        }
        
        // Check for player collisions using spatial partitioning if available
        if (room.spatialGrid) {
          const nearbyPlayers = room.spatialGrid.getObjectsInRadius(
            hazard.x, hazard.y, hazard.radius + playerRadius
          ).filter(obj => obj.id !== undefined); // Only include players
          
          for (const player of nearbyPlayers) {
            // Use squared distance for faster collision checks
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const distSquared = dx * dx + dy * dy;
            const radiusSum = playerRadius + hazard.radius;
            
            if (distSquared <= radiusSum * radiusSum) {
              // Stronger nudge for more dramatic comet impact
              player.velocityX += hazard.velocityX * 1.5;
              player.velocityY += hazard.velocityY * 1.5;
            }
          }
        } else {
          // Fallback to checking all players if spatial grid not available
          for (const player of Object.values(room.players)) {
            const dist = Physics.distance(player.x, player.y, hazard.x, hazard.y);
            
            if (dist <= playerRadius + hazard.radius) {
              // Apply impact
              player.velocityX += hazard.velocityX * 1.5;
              player.velocityY += hazard.velocityY * 1.5;
            }
          }
        }
      }
    }
  }
}

module.exports = HazardManager;
