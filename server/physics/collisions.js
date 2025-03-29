const { GAME_CONSTANTS } = require('../constants');
const PhysicsCore = require('./core');

// Collision detection and handling
class CollisionPhysics {
  // Check if two circles are overlapping
  static circleCollision(x1, y1, r1, x2, y2, r2) {
    const dist = PhysicsCore.distance(x1, y1, x2, y2);
    return dist <= r1 + r2;
  }

  // Handle player-to-player tagging collisions
  static handleTagging(room) {
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
    const untaggedPlayers = players.filter(p => !p.isTagged);
    if (untaggedPlayers.length === 1 && players.length > 1) {
      const lastUntagged = untaggedPlayers[0];
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
