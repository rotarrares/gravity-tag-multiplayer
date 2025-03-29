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
    
    // Find tagged players who can tag others
    const taggedPlayers = players.filter(p => 
      p.isTagged && now - p.lastTaggedTime >= GAME_CONSTANTS.TAG_INVULNERABILITY
    );
    
    // For each tagged player, look for nearby untagged players to tag
    for (const taggedPlayer of taggedPlayers) {
      // Get nearby untagged players only
      const nearbyUntaggedPlayers = room.spatialGrid.getObjectsInRadius(
        taggedPlayer.x, taggedPlayer.y, GAME_CONSTANTS.TAG_RADIUS + GAME_CONSTANTS.PLAYER_RADIUS
      ).filter(obj => 
        obj !== taggedPlayer && 
        obj.id !== undefined && // Make sure it's a player
        !obj.isTagged // Only consider untagged players
      );
      
      // Check for tagging
      for (const untaggedPlayer of nearbyUntaggedPlayers) {
        if (this.circleCollision(
          taggedPlayer.x, taggedPlayer.y, GAME_CONSTANTS.TAG_RADIUS,
          untaggedPlayer.x, untaggedPlayer.y, GAME_CONSTANTS.PLAYER_RADIUS
        )) {
          this.tagPlayer(untaggedPlayer, taggedPlayer, now);
          // Emit a tagging event through the room for visual feedback
          if (room.emitEvent) {
            room.emitEvent('playerTagged', { 
              taggerId: taggedPlayer.id, 
              taggedId: untaggedPlayer.id,
              timestamp: now
            });
          }
          break; // Only tag one player at a time
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
    
    // Find tagged players that can tag others
    for (const taggedPlayer of players) {
      // Skip untagged players or those with invulnerability
      if (!taggedPlayer.isTagged || now - taggedPlayer.lastTaggedTime < GAME_CONSTANTS.TAG_INVULNERABILITY) {
        continue;
      }
      
      for (const untaggedPlayer of players) {
        // Skip self or already tagged players
        if (taggedPlayer.id === untaggedPlayer.id || untaggedPlayer.isTagged) {
          continue;
        }
        
        // Check if in tagging range
        if (this.circleCollision(
          taggedPlayer.x, taggedPlayer.y, GAME_CONSTANTS.TAG_RADIUS,
          untaggedPlayer.x, untaggedPlayer.y, GAME_CONSTANTS.PLAYER_RADIUS
        )) {
          this.tagPlayer(untaggedPlayer, taggedPlayer, now);
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
    
    console.log(`Player ${player.username || player.id} was tagged by ${tagger.username || tagger.id}`);
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
        console.log(`Player ${lastUntagged.username || lastUntagged.id} is the last untagged player!`);
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
