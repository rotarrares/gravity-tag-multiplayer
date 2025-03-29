/**
 * Base Particle class
 */
export default class Particle {
  /**
   * Create a particle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} vx - X velocity
   * @param {number} vy - Y velocity
   * @param {number} lifetime - Lifetime in milliseconds
   * @param {number} size - Particle size
   * @param {string} color - Particle color
   */
  constructor(x, y, vx, vy, lifetime, size, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = size;
    this.color = color;
    this.createdAt = Date.now();
    this.opacity = 1.0;
  }

  /**
   * Update the particle
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   * @returns {boolean} - Whether the particle is still alive
   */
  update(deltaTime) {
    // Update position based on velocity
    this.x += this.vx * deltaTime / 1000;
    this.y += this.vy * deltaTime / 1000;
    
    // Update lifetime
    this.lifetime -= deltaTime;
    
    // Update opacity based on remaining lifetime
    this.opacity = this.lifetime / this.maxLifetime;
    
    // Return whether the particle is still alive
    return this.lifetime > 0;
  }

  /**
   * Draw the particle
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} cameraX - Camera X offset
   * @param {number} cameraY - Camera Y offset
   */
  draw(ctx, cameraX, cameraY) {
    const x = this.x - cameraX;
    const y = this.y - cameraY;
    
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}