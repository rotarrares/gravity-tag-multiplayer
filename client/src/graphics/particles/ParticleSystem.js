/**
 * Particle System Manager
 */
export default class ParticleSystem {
  /**
   * Create a particle system
   * @param {number} maxParticles - Maximum number of particles
   */
  constructor(maxParticles = 500) {
    this.particles = [];
    this.maxParticles = maxParticles;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Add a particle to the system
   * @param {Particle} particle - The particle to add
   */
  addParticle(particle) {
    // If we're at max capacity, remove the oldest particle
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    
    this.particles.push(particle);
  }

  /**
   * Add multiple particles at once
   * @param {Array<Particle>} particles - Array of particles to add
   */
  addParticles(particles) {
    particles.forEach(particle => this.addParticle(particle));
  }

  /**
   * Update all particles in the system
   */
  update() {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Update particles and filter out dead ones
    this.particles = this.particles.filter(particle => particle.update(deltaTime));
  }

  /**
   * Draw all particles
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} cameraX - Camera X offset
   * @param {number} cameraY - Camera Y offset
   */
  draw(ctx, cameraX, cameraY) {
    this.particles.forEach(particle => particle.draw(ctx, cameraX, cameraY));
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }

  /**
   * Get the current particle count
   * @returns {number} - Number of active particles
   */
  getParticleCount() {
    return this.particles.length;
  }
}