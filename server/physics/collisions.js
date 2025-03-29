const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');
const SpatialGrid = require('./spatial');

// Collision detection and handling
class CollisionPhysics {
  // Check if two circles are overlapping
  static circleCollision(x1, y1, r1, x2, y2, r2) {
    // Optimized version: compare distance squared to radius sum squared
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSquared = dx * dx + dy * dy;
    const radiiSumSquared = (r1 + r2) * (r1 + r2);
    return distSquared <= radiiSumSquared;
  }

  // Handle player-to-player tagging collisions using spatial partitioning
  static handleTaggingWithSpatial(room) {
    const now = Date.now();
    const players = Object.values(room.players);
    
    for (const player of players) {
      // Skip tagged players or those with invulnerability
      if (player.isTagged || now - player.lastTaggedTime < GAME_CONSTANTS.TAG_INVULNERABILITY) {
        continue;
      }
      
      // Get nearby players only
      const nearbyPlayers = room.spatialGrid.getObjectsInRadius(
        player.x, player.y, GAME_CONSTANTS.TAG_RADIUS + GAME_CONSTANTS.PLAYER_RADIUS
      ).filter(obj => 
        obj !== player && 
        obj.id !== undefined && // Make sure it's a player
        !obj.isTagged // Skip already tagged players
      );
      
      // Check for tagging
      for (const otherPlayer of nearbyPlayers) {
        if (this.circleCollision(
          player.x, player.y, GAME_CONSTANTS.TAG_RADIUS,
          otherPlayer.x, otherPlayer.y, GAME_CONSTANTS.PLAYER_RADIUS
        )) {
          this.tagPlayer(player, otherPlayer, now);
          break;
        }
      }
    }
    
    // Check if only one player is untagged
    this.checkLastUntagged(players);
  }
  
  // Original method kept for backward compatibility
  static handleTagging(room) {
    // If we have a spatial grid, use that method instead
    if (room.spatialGrid) {
      return this.handleTaggingWithSpatial(room);
    }
    
    const now = Date.now();
    const players = Object.values(room.players);
    
    for (const player of players) {
      // Skip tagged players or those with invulnerability
      if (player.isTagged || now - player.lastTaggedTime < GAME_CONSTANTS.TAG_INVULNERABILITY) {
        continue;
      }
      
      for (const otherPlayer of players) {
        // Skip self or tagged players
        if (player.id === otherPlayer.id || otherPlayer.isTagged) {
          continue;
        }
        
        // Check if in tagging range
        if (this.circleCollision(
          player.x, player.y, GAME_CONSTANTS.TAG_RADIUS,
          otherPlayer.x, otherPlayer.y, GAME_CONSTANTS.PLAYER_RADIUS
        )) {
          this.tagPlayer(player, otherPlayer, now);
          break;
        }
      }
    }
    
    // Check if only one player is untagged
    this.checkLastUntagged(players);
  }
  
  // Apply tag to a player
  static tagPlayer(player, tagger, now) {
    player.isTagged = true;
    player.lastTaggedTime = now;
    player.score -= GAME_CONSTANTS.TAGGED_POINTS_LOST;
    tagger.score += GAME_CONSTANTS.TAG_POINTS;
  }
  
  // Check if only one player is untagged and award bonus
  static checkLastUntagged(players) {
    // Optimize by using filter only once with a count
    let untaggedCount = 0;
    let lastUntagged = null;
    
    for (const player of players) {
      if (!player.isTagged) {
        untaggedCount++;
        lastUntagged = player;
        if (untaggedCount > 1) break; // Early exit if we already found more than one
      }
    }
    
    if (untaggedCount === 1 && players.length > 1 && lastUntagged) {
      if (!lastUntagged.wasLastUntagged) {
        lastUntagged.wasLastUntagged = true;
        lastUntagged.score += 10; // Bonus for being last untagged
      }
    }
  }
  
  // Check for collision between players and arena boundaries
  static checkBoundaryCollisions(player) {
    // Implement if needed for different arena shapes
    // Default behavior is wrapped around edges in PhysicsCore.applyMovement
  }
}

module.exports = CollisionPhysics;
