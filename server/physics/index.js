const PhysicsCore = require('./core');
const GravityPhysics = require('./gravity');
const HazardPhysics = require('./hazards');
const CollisionPhysics = require('./collisions');

// Main physics module that integrates all physics sub-modules
class Physics {
  // Core utilities
  static distance = PhysicsCore.distance;
  static isInGravityWell = PhysicsCore.isInGravityWell;
  static applyMovement = PhysicsCore.applyMovement;
  
  // Gravity physics
  static applyGravity = GravityPhysics.applyGravity;
  static calculatePlayerGravityStrength = GravityPhysics.calculatePlayerGravityStrength;
  static applyGravityForce = GravityPhysics.applyGravityForce;
  
  // Hazard physics
  static applyBlackHoles = HazardPhysics.applyBlackHoles;
  static handleBlackHoleCollision = HazardPhysics.handleBlackHoleCollision;
  static handleCometCollision = HazardPhysics.handleCometCollision;
  static isInNebula = HazardPhysics.isInNebula;
  static moveHazards = HazardPhysics.moveHazards; // Add the new hazard movement function
  
  // Collision physics
  static circleCollision = CollisionPhysics.circleCollision;
  static handleTagging = CollisionPhysics.handleTagging;
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
