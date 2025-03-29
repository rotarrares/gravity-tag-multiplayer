/**
 * Main graphics module that coordinates all rendering operations
 */

// Import renderers
import { renderPlayer, renderPlayerName, renderGravityWell } from './renderers/playerRenderer';
import { renderHazard } from './renderers/hazardRenderer';
import { renderStarField, renderArenaBoundaries } from './renderers/backgroundRenderer';

// Import effects
import { renderPulseEffect } from './effects/pulseEffect';
import { renderCollapseEffect } from './effects/collapseEffect';

// Import particle system
import ParticleSystem from './particles/ParticleSystem';
import { createStarField, createTrail } from './particles/particleEmitters';

/**
 * Graphics controller class
 */
export default class Graphics {
  /**
   * Create a graphics controller
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particleSystem = new ParticleSystem(1000);
    this.lastFrameTime = Date.now();
    
    // Initialize background stars particle system
    this._initBackgroundStars();
    
    // Track player movement for trails
    this.prevPlayerPositions = {};
  }
  
  /**
   * Initialize background star particles
   * @private
   */
  _initBackgroundStars() {
    // Background stars are handled by the starfield renderer now
  }
  
  /**
   * Update the canvas size
   */
  updateCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  /**
   * Render the game state
   * @param {Object} gameState - Current game state
   * @param {string} playerId - Current player ID
   * @param {Object} gameConstants - Game constants
   * @param {Object} effects - Special effects data
   */
  render(gameState, playerId, gameConstants, effects = {}) {
    // Handle empty game state
    if (!gameState.players || !gameState.players[playerId]) {
      return;
    }
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Update canvas size
    this.updateCanvasSize();
    
    // Get current player for camera positioning
    const player = gameState.players[playerId];
    
    // Camera follows player (center of the screen)
    const cameraX = player.x - this.canvas.width / 2;
    const cameraY = player.y - this.canvas.height / 2;
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render background with enhanced starfield
    renderStarField(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      cameraX,
      cameraY,
      gameConstants,
      500,
      currentTime
    );
    
    // Render arena boundaries
    renderArenaBoundaries(
      this.ctx,
      gameConstants,
      cameraX,
      cameraY,
      currentTime
    );
    
    // Update particle system
    this.particleSystem.update();
    
    // Generate trail particles for moving players
    Object.values(gameState.players).forEach(p => {
      if (!this.prevPlayerPositions[p.id]) {
        this.prevPlayerPositions[p.id] = { x: p.x, y: p.y };
        return;
      }
      
      const prevPos = this.prevPlayerPositions[p.id];
      const dx = p.x - prevPos.x;
      const dy = p.y - prevPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only generate trail if player is moving fast enough
      if (distance > 1.5) {
        // Generate trail particles
        const trailParticles = createTrail(
          p.x, p.y,
          dx, dy,
          Math.min(5, Math.floor(distance)),
          p.isTagged ? '#ff6b6b' : '#5183f5'
        );
        
        this.particleSystem.addParticles(trailParticles);
        
        // Update previous position
        this.prevPlayerPositions[p.id] = { x: p.x, y: p.y };
      }
    });
    
    // Render hazards
    gameState.hazards.forEach(hazard => {
      renderHazard(this.ctx, hazard, cameraX, cameraY);
    });
    
    // Draw particles
    this.particleSystem.draw(this.ctx, cameraX, cameraY);
    
    // Draw all players' gravity wells first (layering)
    Object.values(gameState.players).forEach(p => {
      renderGravityWell(this.ctx, p, cameraX, cameraY, gameConstants);
    });
    
    // Draw all players
    Object.values(gameState.players).forEach(p => {
      renderPlayer(this.ctx, p, p.id === playerId, cameraX, cameraY, gameConstants);
    });
    
    // Draw special effects
    if (effects.pulseTriggered) {
      const pulsePlayer = gameState.players[effects.pulseTriggered.playerId];
      if (pulsePlayer) {
        renderPulseEffect(this.ctx, pulsePlayer, cameraX, cameraY, gameConstants);
      }
    }
    
    if (effects.collapseTriggered) {
      const collapsePlayer = gameState.players[effects.collapseTriggered.playerId];
      if (collapsePlayer) {
        renderCollapseEffect(this.ctx, collapsePlayer, cameraX, cameraY, gameConstants);
      }
    }
    
    // Draw player names last (on top of everything)
    Object.values(gameState.players).forEach(p => {
      renderPlayerName(this.ctx, p, cameraX, cameraY, gameConstants);
    });
  }
  
  /**
   * Clear all particles and cached data
   */
  clear() {
    this.particleSystem.clear();
    this.prevPlayerPositions = {};
  }
}
