import { randomRange } from '../utils/mathUtils';

/**
 * Render a black hole hazard
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} hazard - Hazard object
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 */
export const renderBlackHole = (ctx, hazard, cameraX, cameraY) => {
  const x = hazard.x - cameraX;
  const y = hazard.y - cameraY;
  
  ctx.save();
  
  // Create event horizon (inner black circle)
  ctx.beginPath();
  ctx.arc(x, y, hazard.radius * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fill();
  
  // Create outer glow
  const gradient = ctx.createRadialGradient(
    x, y, hazard.radius * 0.5,
    x, y, hazard.radius * 2
  );
  
  gradient.addColorStop(0, 'rgba(30, 0, 60, 0.9)');
  gradient.addColorStop(0.3, 'rgba(60, 0, 120, 0.6)');
  gradient.addColorStop(0.7, 'rgba(90, 30, 160, 0.3)');
  gradient.addColorStop(1, 'rgba(120, 60, 200, 0)');
  
  ctx.beginPath();
  ctx.arc(x, y, hazard.radius * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw accretion disk
  const time = Date.now() / 5000;
  
  // Outer accretion disk
  ctx.beginPath();
  ctx.ellipse(
    x, y, 
    hazard.radius * 1.8, 
    hazard.radius * 0.8, 
    time, 
    0, Math.PI * 2
  );
  ctx.strokeStyle = 'rgba(255, 100, 255, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Inner accretion disk
  ctx.beginPath();
  ctx.ellipse(
    x, y, 
    hazard.radius * 1.4, 
    hazard.radius * 0.6, 
    time * 1.5, 
    0, Math.PI * 2
  );
  ctx.strokeStyle = 'rgba(200, 50, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Add some particle effects (dust being sucked in)
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const angle = time * 2 + (i / particleCount) * Math.PI * 2;
    const distance = hazard.radius * (1.5 + Math.sin(time * 3 + i) * 0.5);
    
    const particleX = x + Math.cos(angle) * distance;
    const particleY = y + Math.sin(angle) * distance;
    
    const size = 1 + Math.sin(time * 5 + i * 2) * 0.5;
    
    ctx.beginPath();
    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 255, 0.8)';
    ctx.fill();
  }
  
  ctx.restore();
};

/**
 * Render a nebula hazard
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} hazard - Hazard object
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 */
export const renderNebula = (ctx, hazard, cameraX, cameraY) => {
  const x = hazard.x - cameraX;
  const y = hazard.y - cameraY;
  
  ctx.save();
  
  // Create main nebula glow
  const gradient = ctx.createRadialGradient(
    x, y, 0,
    x, y, hazard.radius
  );
  
  gradient.addColorStop(0, 'rgba(100, 200, 255, 0.2)');
  gradient.addColorStop(0.7, 'rgba(70, 130, 200, 0.1)');
  gradient.addColorStop(1, 'rgba(50, 100, 150, 0)');
  
  ctx.beginPath();
  ctx.arc(x, y, hazard.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add nebula cloudiness effect
  const time = Date.now() / 1000;
  const cloudCount = 7;
  
  for (let i = 0; i < cloudCount; i++) {
    const angle = (i / cloudCount) * Math.PI * 2;
    const distance = hazard.radius * 0.6;
    
    // Cloud position oscillates with time
    const offsetX = Math.cos(time * 0.2 + i) * distance * 0.3;
    const offsetY = Math.sin(time * 0.3 + i * 2) * distance * 0.3;
    
    const cloudX = x + Math.cos(angle) * distance + offsetX;
    const cloudY = y + Math.sin(angle) * distance + offsetY;
    const cloudSize = hazard.radius * (0.3 + Math.sin(time + i) * 0.1);
    
    // Cloud gradient
    const cloudGradient = ctx.createRadialGradient(
      cloudX, cloudY, 0,
      cloudX, cloudY, cloudSize
    );
    
    cloudGradient.addColorStop(0, 'rgba(150, 220, 255, 0.15)');
    cloudGradient.addColorStop(0.6, 'rgba(120, 200, 255, 0.1)');
    cloudGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
    ctx.fillStyle = cloudGradient;
    ctx.fill();
  }
  
  // Add some bright spots (stars inside nebula)
  const starCount = 4;
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2;
    const distance = hazard.radius * randomRange(0.3, 0.7);
    
    const starX = x + Math.cos(angle + time * 0.1) * distance;
    const starY = y + Math.sin(angle + time * 0.1) * distance;
    
    // Pulsating star size
    const starSize = 1 + Math.sin(time * 2 + i * 3) * 0.5;
    
    // Star glow
    const starGradient = ctx.createRadialGradient(
      starX, starY, 0,
      starX, starY, starSize * 4
    );
    
    starGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    starGradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.4)');
    starGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(starX, starY, starSize * 4, 0, Math.PI * 2);
    ctx.fillStyle = starGradient;
    ctx.fill();
    
    // Star core
    ctx.beginPath();
    ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
  }
  
  ctx.restore();
};

/**
 * Render a comet hazard
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} hazard - Hazard object
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 */
export const renderComet = (ctx, hazard, cameraX, cameraY) => {
  const x = hazard.x - cameraX;
  const y = hazard.y - cameraY;
  
  ctx.save();
  
  // Calculate movement angle
  const angle = Math.atan2(hazard.velocityY, hazard.velocityX);
  const tailLength = hazard.radius * 15;
  
  // Draw comet tail
  const tailGradient = ctx.createLinearGradient(
    x, y,
    x - Math.cos(angle) * tailLength,
    y - Math.sin(angle) * tailLength
  );
  
  tailGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  tailGradient.addColorStop(0.3, 'rgba(180, 220, 255, 0.6)');
  tailGradient.addColorStop(0.6, 'rgba(120, 180, 255, 0.3)');
  tailGradient.addColorStop(1, 'rgba(80, 140, 255, 0)');
  
  // Draw a tapered tail using a custom shape
  const tailWidth = hazard.radius * 1.2;
  const perpX = Math.sin(angle) * tailWidth;
  const perpY = -Math.cos(angle) * tailWidth;
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  
  // Control points for curved tail
  const cp1x = x - Math.cos(angle) * tailLength * 0.3 + perpX * 0.5;
  const cp1y = y - Math.sin(angle) * tailLength * 0.3 + perpY * 0.5;
  const cp2x = x - Math.cos(angle) * tailLength * 0.7 + perpX * 0.8;
  const cp2y = y - Math.sin(angle) * tailLength * 0.7 + perpY * 0.8;
  
  const endX = x - Math.cos(angle) * tailLength;
  const endY = y - Math.sin(angle) * tailLength;
  
  // Top curve of tail
  ctx.quadraticCurveTo(cp1x, cp1y, endX + perpX, endY + perpY);
  
  // Bottom curve of tail
  ctx.quadraticCurveTo(endX, endY, endX - perpX, endY - perpY);
  ctx.quadraticCurveTo(cp2x - perpX * 1.6, cp2y - perpY * 1.6, x, y);
  
  ctx.fillStyle = tailGradient;
  ctx.fill();
  
  // Add some small particle details to the tail
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    const particleDistance = t * tailLength * 0.9;
    
    // Particles spread out more toward the end of the tail
    const spreadFactor = t * tailWidth * 1.2;
    const particleX = x - Math.cos(angle) * particleDistance + randomRange(-spreadFactor, spreadFactor);
    const particleY = y - Math.sin(angle) * particleDistance + randomRange(-spreadFactor, spreadFactor);
    
    // Particles get smaller toward the end of the tail
    const particleSize = hazard.radius * 0.3 * (1 - t);
    
    ctx.beginPath();
    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * (1 - t)})`;
    ctx.fill();
  }
  
  // Draw comet core with gradient
  const coreGradient = ctx.createRadialGradient(
    x, y, 0,
    x, y, hazard.radius
  );
  
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  coreGradient.addColorStop(0.4, 'rgba(200, 230, 255, 0.9)');
  coreGradient.addColorStop(1, 'rgba(150, 200, 255, 0.8)');
  
  ctx.beginPath();
  ctx.arc(x, y, hazard.radius, 0, Math.PI * 2);
  ctx.fillStyle = coreGradient;
  ctx.fill();
  
  // Add a subtle glow around the core
  const glowGradient = ctx.createRadialGradient(
    x, y, hazard.radius * 0.8,
    x, y, hazard.radius * 2
  );
  
  glowGradient.addColorStop(0, 'rgba(200, 240, 255, 0.6)');
  glowGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
  
  ctx.beginPath();
  ctx.arc(x, y, hazard.radius * 2, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();
  
  ctx.restore();
};

/**
 * Factory function to render any type of hazard
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} hazard - Hazard object with type property
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 */
export const renderHazard = (ctx, hazard, cameraX, cameraY) => {
  switch (hazard.type) {
    case 'blackHole':
      renderBlackHole(ctx, hazard, cameraX, cameraY);
      break;
    case 'nebula':
      renderNebula(ctx, hazard, cameraX, cameraY);
      break;
    case 'comet':
      renderComet(ctx, hazard, cameraX, cameraY);
      break;
    default:
      console.warn(`Unknown hazard type: ${hazard.type}`);
  }
};