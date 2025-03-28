import Particle from './Particle';
import { randomRange, randomInt, degToRad, clamp } from '../utils/mathUtils';
import { rgba, COLOR_PALETTES } from '../utils/colorUtils';

/**
 * Create an explosion of particles
 * @param {number} x - Center X coordinate
 * @param {number} y - Center Y coordinate
 * @param {number} count - Number of particles to emit
 * @param {string} color - Base color for particles
 * @param {number} speed - Particle speed
 * @param {number} size - Particle size range [min, max]
 * @param {number} lifetime - Particle lifetime range [min, max] in ms
 * @returns {Array<Particle>} - Array of created particles
 */
export const createExplosion = (x, y, count = 30, color = '#fbbf24', speed = 100, size = [2, 6], lifetime = [500, 1500]) => {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    // Random angle and speed
    const angle = randomRange(0, Math.PI * 2);
    const particleSpeed = randomRange(speed * 0.5, speed * 1.5);
    
    // Calculate velocity components
    const vx = Math.cos(angle) * particleSpeed;
    const vy = Math.sin(angle) * particleSpeed;
    
    // Random size and lifetime
    const particleSize = randomRange(size[0], size[1]);
    const particleLifetime = randomInt(lifetime[0], lifetime[1]);
    
    // Create particle with slight color variation
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    const colorVariation = 30;
    const particleColor = rgba(
      clamp(r + randomInt(-colorVariation, colorVariation), 0, 255),
      clamp(g + randomInt(-colorVariation, colorVariation), 0, 255),
      clamp(b + randomInt(-colorVariation, colorVariation), 0, 255),
      1
    );
    
    particles.push(new Particle(x, y, vx, vy, particleLifetime, particleSize, particleColor));
  }
  
  return particles;
};

/**
 * Creates a trail of particles behind a moving object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} vx - X velocity of the object
 * @param {number} vy - Y velocity of the object
 * @param {number} count - Number of particles to emit
 * @param {string} color - Base color for particles
 * @returns {Array<Particle>} - Array of created particles
 */
export const createTrail = (x, y, vx, vy, count = 5, color = '#5183f5') => {
  const particles = [];
  const speed = 10;
  
  // Calculate perpendicular vector for width
  const length = Math.sqrt(vx * vx + vy * vy);
  if (length === 0) return particles;
  
  const normalizedVx = vx / length;
  const normalizedVy = vy / length;
  const perpX = -normalizedVy;
  const perpY = normalizedVx;
  
  for (let i = 0; i < count; i++) {
    // Add some randomness to position
    const widthOffset = randomRange(-10, 10);
    const lengthOffset = randomRange(-5, 0);
    
    const posX = x + perpX * widthOffset + normalizedVx * lengthOffset;
    const posY = y + perpY * widthOffset + normalizedVy * lengthOffset;
    
    // Reverse velocity direction with small randomness
    const particleVx = -normalizedVx * speed * randomRange(0.5, 1.5) + randomRange(-5, 5);
    const particleVy = -normalizedVy * speed * randomRange(0.5, 1.5) + randomRange(-5, 5);
    
    // Random size and lifetime
    const particleSize = randomRange(1, 3);
    const particleLifetime = randomInt(300, 800);
    
    // Create particle with opacity variation
    const opacity = randomRange(0.3, 0.7);
    const particleColor = color.startsWith('#') ? 
      rgba(
        parseInt(color.substr(1, 2), 16),
        parseInt(color.substr(3, 2), 16),
        parseInt(color.substr(5, 2), 16),
        opacity
      ) : color;
    
    particles.push(new Particle(posX, posY, particleVx, particleVy, particleLifetime, particleSize, particleColor));
  }
  
  return particles;
};

/**
 * Creates a pulse ring of particles
 * @param {number} x - Center X coordinate
 * @param {number} y - Center Y coordinate
 * @param {number} radius - Ring radius
 * @param {number} count - Number of particles to emit
 * @param {string} color - Base color for particles
 * @param {number} speed - Expansion speed
 * @returns {Array<Particle>} - Array of created particles
 */
export const createPulseRing = (x, y, radius = 50, count = 40, color = '#5183f5', speed = 50) => {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    // Position particles in a circle
    const angle = (i / count) * Math.PI * 2;
    const posX = x + Math.cos(angle) * radius;
    const posY = y + Math.sin(angle) * radius;
    
    // Velocity points outward
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // Random size and consistent lifetime
    const particleSize = randomRange(2, 4);
    const particleLifetime = 1000;
    
    particles.push(new Particle(posX, posY, vx, vy, particleLifetime, particleSize, color));
  }
  
  return particles;
};

/**
 * Creates star particles for background
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} count - Number of stars to create
 * @param {number} cameraX - Camera X position
 * @param {number} cameraY - Camera Y position
 * @returns {Array<Particle>} - Array of created star particles
 */
export const createStarField = (width, height, count = 100, cameraX = 0, cameraY = 0) => {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    // Random position within view
    const posX = cameraX + randomRange(0, width);
    const posY = cameraY + randomRange(0, height);
    
    // Stars don't move
    const vx = 0;
    const vy = 0;
    
    // Random size and very long lifetime
    const particleSize = randomRange(0.5, 2);
    const particleLifetime = 60000; // 1 minute, will be recycled
    
    // Random brightness
    const brightness = randomInt(180, 255);
    const particleColor = rgba(brightness, brightness, brightness + randomInt(0, 40), randomRange(0.6, 1));
    
    particles.push(new Particle(posX, posY, vx, vy, particleLifetime, particleSize, particleColor));
  }
  
  return particles;
};

/**
 * Creates a spiral of particles
 * @param {number} x - Center X coordinate
 * @param {number} y - Center Y coordinate
 * @param {number} count - Number of particles
 * @param {string} color - Particle color
 * @returns {Array<Particle>} - Array of created particles
 */
export const createSpiral = (x, y, count = 30, color = '#5183f5') => {
  const particles = [];
  const maxRadius = 50;
  
  for (let i = 0; i < count; i++) {
    // Create a spiral pattern
    const progress = i / count;
    const radius = progress * maxRadius;
    const angle = progress * Math.PI * 6;
    
    const posX = x + Math.cos(angle) * radius;
    const posY = y + Math.sin(angle) * radius;
    
    // Particles move toward center
    const vx = (x - posX) * 0.5;
    const vy = (y - posY) * 0.5;
    
    // Size and lifetime based on position in spiral
    const particleSize = 3 - 2 * progress;
    const particleLifetime = 1000 + 1000 * progress;
    
    particles.push(new Particle(posX, posY, vx, vy, particleLifetime, particleSize, color));
  }
  
  return particles;
};