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
 * Safely create a radial gradient
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x0 - Start X
 * @param {number} y0 - Start Y
 * @param {number} r0 - Start radius
 * @param {number} x1 - End X
 * @param {number} y1 - End Y
 * @param {number} r1 - End radius
 * @returns {CanvasGradient|null} The gradient object or null if creation fails
 */
const safeRadialGradient = (ctx, x0, y0, r0, x1, y1, r1) => {
  // Check if context is valid and has the createRadialGradient method
  if (!ctx || typeof ctx.createRadialGradient !== 'function') {
    console.warn('Invalid canvas context or createRadialGradient not available');
    return null;
  }
  
  try {
    const safeR0 = Math.max(0.001, r0);
    const safeR1 = Math.max(safeR0 + 0.001, r1); // Make sure r1 > r0
    return ctx.createRadialGradient(x0, y0, safeR0, x1, y1, safeR1);
  } catch (error) {
    console.warn('Error creating radial gradient:', error);
    return null;
  }
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
  // Verify we have a valid canvas context
  if (!ctx || typeof ctx.beginPath !== 'function') {
    console.warn('Invalid canvas context');
    return;
  }

  // If player position is invalid, don't render
  if (!player || typeof player.x !== 'number' || typeof player.y !== 'number') {
    console.warn('Invalid player data for pulse effect');
    return;
  }

  // Ensure we have valid game constants
  if (!gameConstants || typeof gameConstants.GRAVITY_RANGE !== 'number' || 
      typeof gameConstants.PULSE_DURATION !== 'number') {
    console.warn('Invalid game constants for pulse effect');
    return;
  }

  const x = player.x - cameraX;
  const y = player.y - cameraY;
  
  // Calculate pulse animation progress (0 to 1)
  const now = Date.now();
  if (!player.pulseStartTime || typeof player.pulseStartTime !== 'number') {
    console.warn('Invalid pulse start time');
    return;
  }
  
  const pulseElapsed = now - player.pulseStartTime;
  const pulseDuration = Math.max(100, gameConstants.PULSE_DURATION); // Ensure non-zero duration
  const pulseProgress = Math.min(1, Math.max(0, pulseElapsed / pulseDuration));
  
  // Use easing function for smoother animation
  const easedProgress = easeOutQuad(pulseProgress);
  
  // Expand and fade out
  const GRAVITY_RANGE = Math.max(1, gameConstants.GRAVITY_RANGE);
  const pulseRadius = Math.max(0.1, GRAVITY_RANGE * easedProgress * 1.8);
  const pulseOpacity = 1 - easedProgress;
  
  try {
    ctx.save();
    
    // Base color for the pulse effect
    const baseColor = player.isTagged ? 
      'rgba(255, 107, 107,' : 
      'rgba(81, 131, 245,';
    
    // Make sure inner radius is at least 0.001 to avoid Canvas API errors
    const innerRadius = Math.max(0.001, pulseRadius * 0.8);
    
    // Create a gradient for more dramatic effect using our safe function
    const gradient = safeRadialGradient(
      ctx, x, y, innerRadius,
      x, y, pulseRadius
    );
    
    if (gradient) {
      // Add color stops to gradient
      gradient.addColorStop(0, `${baseColor} 0)`); // Transparent center
      gradient.addColorStop(0.7, `${baseColor} ${pulseOpacity * 0.7})`);
      gradient.addColorStop(0.9, `${baseColor} ${pulseOpacity})`);
      gradient.addColorStop(1, `${baseColor} 0)`); // Fade to transparent at edge
      
      // Draw pulse wave rings
      ctx.beginPath();
      safeArc(ctx, x, y, pulseRadius);
      ctx.lineWidth = Math.max(0.001, 4 * (1 - easedProgress));
      ctx.strokeStyle = gradient;
      ctx.stroke();
    } else {
      // Fallback if gradient creation failed
      ctx.beginPath();
      safeArc(ctx, x, y, pulseRadius);
      ctx.lineWidth = Math.max(0.001, 4 * (1 - easedProgress));
      ctx.strokeStyle = `${baseColor} ${pulseOpacity})`;
      ctx.stroke();
    }
    
    // Add an inner ring
    const innerRingRadius = Math.max(0.001, pulseRadius * 0.85);
    ctx.beginPath();
    safeArc(ctx, x, y, innerRingRadius);
    ctx.lineWidth = Math.max(0.001, 2 * (1 - easedProgress));
    ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.7})`;
    ctx.stroke();
    
    // Add energy particles in the wave
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = Math.max(0.001, pulseRadius * (0.9 + Math.sin(angle * 3) * 0.1));
      
      // Verify calculated coordinates are valid numbers
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      if (isNaN(particleX) || isNaN(particleY)) {
        continue;
      }
      
      const size = Math.max(0.001, 3 * (1 - easedProgress));
      
      ctx.beginPath();
      safeArc(ctx, x, y, size);
      ctx.fillStyle = `${baseColor} ${pulseOpacity * 1.2})`;
      ctx.fill();
    }
    
    ctx.restore();
  } catch (error) {
    console.warn('Error rendering pulse effect:', error);
    
    // Ultra-simple fallback rendering that should never fail
    try {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.001, pulseRadius), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } catch (e) {
      // If even this fails, just log and move on
      console.error('Ultimate fallback rendering failed:', e);
    }
  }
};
