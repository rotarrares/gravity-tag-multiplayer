import { regularPolygon } from '../utils/mathUtils';

/**
 * Render a star field background
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 * @param {number} starCount - Number of stars to render
 * @param {number} time - Current time (for animations)
 */
export const renderStarField = (ctx, width, height, cameraX, cameraY, gameConstants, starCount = 500, time = Date.now()) => {
  // Fill the background with a dark space color
  ctx.fillStyle = '#050A20';
  ctx.fillRect(0, 0, width, height);
  
  // Create a subtle space gradient
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 1.5
  );
  
  gradient.addColorStop(0, '#0A1030');
  gradient.addColorStop(1, '#050A20');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Use a fixed seed for consistent star positions
  const starSeed = 12345;
  
  // Distant stars (small, don't move much with camera)
  for (let i = 0; i < starCount * 0.7; i++) {
    // Pseudo-random position based on index and seed
    const x = ((starSeed * (i + 1) * 17) % (gameConstants.ARENA_WIDTH * 1.2)) - (cameraX * 0.2);
    const y = ((starSeed * (i + 1) * 23) % (gameConstants.ARENA_HEIGHT * 1.2)) - (cameraY * 0.2);
    
    // Only draw stars within viewport
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      // Vary star sizes
      const size = ((i % 3) + 1) * 0.4;
      
      // Vary star brightness
      const brightness = 155 + ((i * 100) % 100);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 40})`;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Closer stars (larger, move more with camera)
  for (let i = 0; i < starCount * 0.3; i++) {
    const index = Math.floor(starCount * 0.7) + i;
    // Pseudo-random position with more camera movement
    const x = ((starSeed * (index + 1) * 29) % gameConstants.ARENA_WIDTH) - cameraX;
    const y = ((starSeed * (index + 1) * 37) % gameConstants.ARENA_HEIGHT) - cameraY;
    
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      // Larger size for closer stars
      const size = ((i % 3) + 1) * 0.7;
      
      // Brighter with some color variation
      const r = 200 + ((i * 55) % 55);
      const g = 200 + ((i * 55) % 55);
      const b = 220 + ((i * 35) % 35);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add a subtle glow to some stars
      if (i % 5 === 0) {
        const glowSize = size * 3;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Make some stars twinkle
      if (i % 8 === 0) {
        const twinklePhase = (time / 500 + i) % 2;
        const twinkleSize = size + (twinklePhase < 1 ? twinklePhase : 2 - twinklePhase) * 0.5;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, twinkleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Add a few distant galaxies/nebulae
  const galaxyCount = 3;
  for (let i = 0; i < galaxyCount; i++) {
    const galaxyX = ((starSeed * (i + 1) * 123) % gameConstants.ARENA_WIDTH) - (cameraX * 0.1);
    const galaxyY = ((starSeed * (i + 1) * 321) % gameConstants.ARENA_HEIGHT) - (cameraY * 0.1);
    
    if (galaxyX >= -200 && galaxyX <= width + 200 && galaxyY >= -200 && galaxyY <= height + 200) {
      const galaxySize = 100 + (i * 50);
      const galaxyAngle = (i * Math.PI) / 4;
      
      const galaxyGradient = ctx.createRadialGradient(
        galaxyX, galaxyY, 0,
        galaxyX, galaxyY, galaxySize
      );
      
      // Different colors for different galaxies
      let color1, color2;
      switch (i % 3) {
        case 0: // Blueish
          color1 = 'rgba(80, 120, 200, 0.03)';
          color2 = 'rgba(60, 100, 180, 0)';
          break;
        case 1: // Reddish
          color1 = 'rgba(200, 100, 80, 0.02)';
          color2 = 'rgba(180, 80, 60, 0)';
          break;
        case 2: // Purplish
          color1 = 'rgba(150, 80, 200, 0.02)';
          color2 = 'rgba(120, 60, 180, 0)';
          break;
      }
      
      galaxyGradient.addColorStop(0, color1);
      galaxyGradient.addColorStop(1, color2);
      
      // Draw elliptical galaxy
      ctx.save();
      ctx.translate(galaxyX, galaxyY);
      ctx.rotate(galaxyAngle);
      ctx.scale(1, 0.5); // Make it elliptical
      
      ctx.fillStyle = galaxyGradient;
      ctx.beginPath();
      ctx.arc(0, 0, galaxySize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }
};

/**
 * Render arena boundaries
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} gameConstants - Game constants
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {number} time - Current time (for animations)
 */
export const renderArenaBoundaries = (ctx, gameConstants, cameraX, cameraY, time = Date.now()) => {
  const centerX = gameConstants.ARENA_WIDTH / 2 - cameraX;
  const centerY = gameConstants.ARENA_HEIGHT / 2 - cameraY;
  const radius = Math.min(gameConstants.ARENA_WIDTH, gameConstants.ARENA_HEIGHT) / 2;
  
  ctx.save();
  
  // Animate boundary glow
  const glowIntensity = 0.2 + Math.sin(time / 2000) * 0.1;
  
  // Draw hexagonal or circular arena based on shape setting
  if (gameConstants.ARENA_SHAPE === 'hexagon') {
    // Get points for hexagon
    const hexPoints = regularPolygon(6, radius, Math.PI / 6);
    
    // Draw outer glow
    ctx.beginPath();
    hexPoints.forEach((point, index) => {
      const [px, py] = point;
      if (index === 0) {
        ctx.moveTo(centerX + px, centerY + py);
      } else {
        ctx.lineTo(centerX + px, centerY + py);
      }
    });
    ctx.closePath();
    
    // Create gradient for glow effect
    const glowWidth = 15;
    ctx.lineWidth = glowWidth;
    const glow = ctx.createLinearGradient(
      centerX - radius, centerY - radius,
      centerX + radius, centerY + radius
    );
    
    glow.addColorStop(0, `rgba(81, 131, 245, ${glowIntensity * 0.5})`);
    glow.addColorStop(0.5, `rgba(81, 131, 245, ${glowIntensity})`);
    glow.addColorStop(1, `rgba(81, 131, 245, ${glowIntensity * 0.5})`);
    
    ctx.strokeStyle = glow;
    ctx.stroke();
    
    // Draw main boundary line
    ctx.beginPath();
    hexPoints.forEach((point, index) => {
      const [px, py] = point;
      if (index === 0) {
        ctx.moveTo(centerX + px, centerY + py);
      } else {
        ctx.lineTo(centerX + px, centerY + py);
      }
    });
    ctx.closePath();
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(81, 131, 245, 0.8)';
    ctx.stroke();
    
  } else {
    // Circular arena
    // Draw outer glow
    const glowWidth = 15;
    
    const glow = ctx.createRadialGradient(
      centerX, centerY, radius - glowWidth,
      centerX, centerY, radius + glowWidth
    );
    
    glow.addColorStop(0, `rgba(81, 131, 245, ${glowIntensity})`);
    glow.addColorStop(0.5, `rgba(81, 131, 245, ${glowIntensity * 0.7})`);
    glow.addColorStop(1, `rgba(81, 131, 245, 0)`);
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + glowWidth, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, radius - glowWidth, 0, Math.PI * 2, true);
    ctx.fill();
    
    // Draw main boundary line
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(81, 131, 245, 0.8)';
    ctx.stroke();
  }
  
  // Add some decorative elements around the boundary
  const markerCount = gameConstants.ARENA_SHAPE === 'hexagon' ? 6 : 8;
  for (let i = 0; i < markerCount; i++) {
    const angle = (i / markerCount) * Math.PI * 2;
    const markerX = centerX + Math.cos(angle) * radius;
    const markerY = centerY + Math.sin(angle) * radius;
    
    // Pulsating marker
    const pulse = Math.sin(time / 1000 + i) * 0.5 + 0.5;
    
    ctx.beginPath();
    ctx.arc(markerX, markerY, 4 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 200, 255, ${0.5 + pulse * 0.5})`;
    ctx.fill();
  }
  
  ctx.restore();
};