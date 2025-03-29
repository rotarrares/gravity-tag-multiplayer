import { easeOutQuad } from '../utils/mathUtils';

/**
 * Render a gravity pulse effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player that triggered the pulse
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderPulseEffect = (ctx, player, cameraX, cameraY, gameConstants) => {
  const x = player.x - cameraX;
  const y = player.y - cameraY;
  
  // Calculate pulse animation progress (0 to 1)
  const pulseElapsed = Date.now() - player.pulseStartTime;
  const pulseProgress = Math.min(1, pulseElapsed / gameConstants.PULSE_DURATION);
  
  // Use easing function for smoother animation
  const easedProgress = easeOutQuad(pulseProgress);
  
  // Expand and fade out
  const pulseRadius = gameConstants.GRAVITY_RANGE * easedProgress * 1.8;
  const pulseOpacity = 1 - easedProgress;
  
  ctx.save();
  
  // Create a gradient for more dramatic effect
  const gradient = ctx.createRadialGradient(
    x, y, pulseRadius * 0.8,
    x, y, pulseRadius
  );
  
  // Determine color based on player state
  const baseColor = player.isTagged ? 
    'rgba(255, 107, 107,' : 
    'rgba(81, 131, 245,';
  
  gradient.addColorStop(0, `${baseColor} 0)`); // Transparent center
  gradient.addColorStop(0.7, `${baseColor} ${pulseOpacity * 0.7})`);
  gradient.addColorStop(0.9, `${baseColor} ${pulseOpacity})`);
  gradient.addColorStop(1, `${baseColor} 0)`); // Fade to transparent at edge
  
  // Draw pulse wave rings
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.lineWidth = 4 * (1 - easedProgress);
  ctx.strokeStyle = gradient;
  ctx.stroke();
  
  // Add an inner ring
  const innerRadius = pulseRadius * 0.85;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.lineWidth = 2 * (1 - easedProgress);
  ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.7})`;
  ctx.stroke();
  
  // Add energy particles in the wave
  const particleCount = 12;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = pulseRadius * (0.9 + Math.sin(angle * 3) * 0.1);
    
    const particleX = x + Math.cos(angle) * distance;
    const particleY = y + Math.sin(angle) * distance;
    
    const size = 3 * (1 - easedProgress);
    
    ctx.beginPath();
    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
    ctx.fillStyle = `${baseColor} ${pulseOpacity * 1.2})`;
    ctx.fill();
  }
  
  ctx.restore();
};
