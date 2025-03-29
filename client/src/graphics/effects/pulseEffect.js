import { easeOutQuad } from '../utils/mathUtils';

/**
 * Safely create an arc path
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} radius - Radius (will be forced positive)
 */
const safeArc = (ctx, x, y, radius) => {
  if (!ctx || typeof ctx.arc !== 'function') return;
  const safeRadius = Math.max(0.001, radius);
  ctx.arc(x, y, safeRadius, 0, Math.PI * 2);
};

/**
 * Render a gravity pulse effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player that triggered the pulse
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderPulseEffect = (ctx, player, cameraX, cameraY, gameConstants) => {
  // Basic validation
  if (!ctx || !player || !gameConstants) return;

  try {
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
    
    // Determine color based on player state
    const baseColor = player.isTagged ? 
      'rgba(255, 107, 107,' : 
      'rgba(81, 131, 245,';
    
    // Main pulse wave
    ctx.beginPath();
    safeArc(ctx, x, y, pulseRadius);
    ctx.lineWidth = 4 * (1 - easedProgress);
    ctx.strokeStyle = `${baseColor} ${pulseOpacity})`;
    ctx.stroke();
    
    // Inner ring
    ctx.beginPath();
    safeArc(ctx, x, y, pulseRadius * 0.85);
    ctx.lineWidth = 2 * (1 - easedProgress);
    ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.7})`;
    ctx.stroke();
    
    // Add glow effect
    ctx.beginPath();
    safeArc(ctx, x, y, pulseRadius * 0.7);
    ctx.fillStyle = `${baseColor} ${pulseOpacity * 0.2})`;
    ctx.fill();
    
    // Add energy particles in the wave
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = pulseRadius * (0.9 + Math.sin(angle * 3) * 0.1);
      
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      const size = 3 * (1 - easedProgress);
      
      ctx.beginPath();
      safeArc(ctx, particleX, particleY, size);
      ctx.fillStyle = `${baseColor} ${pulseOpacity * 1.2})`;
      ctx.fill();
    }
    
    // Add streaks radiating outward
    const streakCount = 8;
    for (let i = 0; i < streakCount; i++) {
      const angle = (i / streakCount) * Math.PI * 2;
      const innerRadius = pulseRadius * 0.4;
      const outerRadius = pulseRadius * 0.95;
      
      const startX = x + Math.cos(angle) * innerRadius;
      const startY = y + Math.sin(angle) * innerRadius;
      const endX = x + Math.cos(angle) * outerRadius;
      const endY = y + Math.sin(angle) * outerRadius;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 2 * (1 - easedProgress);
      ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.8})`;
      ctx.stroke();
    }
    
    ctx.restore();
  } catch (error) {
    console.warn('Error rendering pulse effect:', error);
    
    // Simple fallback rendering
    try {
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x - cameraX, player.y - cameraY, gameConstants.GRAVITY_RANGE * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = player.isTagged ? 'rgba(255, 107, 107, 0.7)' : 'rgba(81, 131, 245, 0.7)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    } catch (e) {
      // If even this fails, do nothing
    }
  }
};
