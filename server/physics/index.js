const PhysicsCore = require('./core');
const GravityPhysics = require('./gravity');
const HazardPhysics = require('./hazards');
const CollisionPhysics = require('./collisions');
const SpatialGrid = require('./spatial');

// Main physics module that integrates all physics sub-modules
class Physics {
  constructor() {
    this.spatialGrid = new SpatialGrid(300); // 300px cell size
  }

  // Update the spatial grid with all objects in the room
  updateSpatialGrid(room) {
    const allObjects = [
      ...Object.values(room.players),
      ...room.hazards
    ];
    this.spatialGrid.update(allObjects);
  }

  // Get nearby objects for an entity
  getNearbyObjects(entity, radius) {
    return this.spatialGrid.getObjectsInRadius(entity.x, entity.y, radius);
  }

  // Core utilities
  static distance = PhysicsCore.distance;
  static isInGravityWell = PhysicsCore.isInGravityWell;

  // Modified to use spatial partitioning
  static applyMovement(room) {
    PhysicsCore.applyMovement(room);
  }
  
  // Gravity physics
  static applyGravity(room) {
    // Initialize the spatial grid if it doesn't exist
    if (!room.spatialGrid) {
      room.spatialGrid = new SpatialGrid(300);
    }
    
    // Update the spatial grid with current positions
    const allObjects = [
      ...Object.values(room.players),
      ...room.hazards
    ];
    room.spatialGrid.update(allObjects);
    
    // Calculate gravity strength for each player (this doesn't depend on other players)
    for (const player of Object.values(room.players)) {
      player.gravityStrength = GravityPhysics.calculatePlayerGravityStrength(player);
    }
    
    // Apply gravity between players using spatial partitioning
    GravityPhysics.applyGravityWithSpatial(room);
  }
  
  static calculatePlayerGravityStrength = GravityPhysics.calculatePlayerGravityStrength;
  static applyGravityForce = GravityPhysics.applyGravityForce;
  
  // Hazard physics
  static applyBlackHoles(room) {
    // Use spatial partitioning for black hole effects
    HazardPhysics.applyBlackHolesWithSpatial(room);
  }
  
  static handleBlackHoleCollision = HazardPhysics.handleBlackHoleCollision;
  static handleCometCollision = HazardPhysics.handleCometCollision;
  static isInNebula = HazardPhysics.isInNebula;
  static moveHazards = HazardPhysics.moveHazards;
  
  // Collision physics
  static circleCollision = CollisionPhysics.circleCollision;
  
  static handleTagging(room) {
    // Use spatial partitioning for collision detection
    if (!room.spatialGrid) {
      room.spatialGrid = new SpatialGrid(300);
    }
    
    CollisionPhysics.handleTaggingWithSpatial(room);
  }
  
  static tagPlayer = CollisionPhysics.tagPlayer;
  static checkLastUntagged = CollisionPhysics.checkLastUntagged;
  static checkBoundaryCollisions = CollisionPhysics.checkBoundaryCollisions;
}

// Export the main Physics class as well as all sub-modules for direct access if needed
module.exports = Physics;
module.exports.Core = PhysicsCore;
module.exports.Gravity = GravityPhysics;
module.exports.Hazards = HazardPhysics;
module.exports.Collisions = CollisionPhysics;
module.exports.SpatialGrid = SpatialGrid;
