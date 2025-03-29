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
  if (!ctx || !player) return;

  try {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Calculate pulse animation progress (0 to 1)
    const pulseElapsed = Date.now() - player.pulseStartTime;
    const pulseProgress = Math.min(1, pulseElapsed / gameConstants.PULSE_DURATION);
    
    // Use easing function for smoother animation
    const easedProgress = easeOutQuad(pulseProgress);
    
    // Expand and fade out - limit to visible screen area
    const screenSize = Math.max(ctx.canvas.width, ctx.canvas.height);
    const maxVisibleRadius = screenSize * 0.6; // 60% of screen diagonal
    const fullGravityRange = Math.min(gameConstants.GRAVITY_RANGE, maxVisibleRadius);
    
    // Calculate pulse wave radius - smaller proportion of the larger gravity range
    const pulseRadius = fullGravityRange * easedProgress * 0.3;
    const pulseOpacity = 1 - easedProgress;
    
    ctx.save();
    
    // Determine color based on player state
    const baseColor = player.isTagged ? 
      'rgba(255, 107, 107,' : 
      'rgba(81, 131, 245,';

    // Draw core glow
    ctx.beginPath();
    safeArc(ctx, x, y, gameConstants.PLAYER_RADIUS * 1.8);
    ctx.fillStyle = `${baseColor} ${pulseOpacity * 0.6})`;
    ctx.fill();
    
    // Draw main pulse wave (thicker, more visible line)
    ctx.beginPath();
    safeArc(ctx, x, y, pulseRadius);
    ctx.lineWidth = 8; // Much thicker line for visibility
    ctx.strokeStyle = `${baseColor} ${pulseOpacity})`;
    ctx.stroke();
    
    // Secondary pulse wave (thinner)
    ctx.beginPath();
    safeArc(ctx, x, y, pulseRadius * 0.85);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.7})`;
    ctx.stroke();
    
    // Draw partial visible range indication
    const visibleRange = Math.min(fullGravityRange, maxVisibleRadius);
    ctx.beginPath();
    safeArc(ctx, x, y, visibleRange * 0.5); // Show half the range
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 8]); // Dashed line for the gravity range
    ctx.strokeStyle = `${baseColor} ${0.4 * pulseOpacity})`;
    ctx.stroke();
    
    // Show text with actual range
    ctx.font = "14px Arial";
    ctx.fillStyle = `${baseColor} ${0.7 * pulseOpacity})`;
    ctx.textAlign = "center";
    ctx.fillText(`Gravity Range: ${Math.round(gameConstants.GRAVITY_RANGE)}`, x, y + visibleRange * 0.5 + 20);
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Add energy particles in the wave (larger, more visible)
    const particleCount = 18; // More particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = pulseRadius * (0.9 + Math.sin(angle * 3) * 0.1);
      
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      const size = 6 * (1 - easedProgress * 0.5); // Larger particles that fade less
      
      ctx.beginPath();
      safeArc(ctx, particleX, particleY, size);
      ctx.fillStyle = `${baseColor} ${pulseOpacity * 1.2})`;
      ctx.fill();
    }
    
    // Add streaks radiating outward for more visual impact
    const streakCount = 24; // More streaks
    for (let i = 0; i < streakCount; i++) {
      const angle = (i / streakCount) * Math.PI * 2;
      const innerRadius = pulseRadius * 0.2;
      const outerRadius = pulseRadius * 1.1;
      
      const startX = x + Math.cos(angle) * innerRadius;
      const startY = y + Math.sin(angle) * innerRadius;
      const endX = x + Math.cos(angle) * outerRadius;
      const endY = y + Math.sin(angle) * outerRadius;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 3; // Thicker streaks
      ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.9})`;
      ctx.stroke();
    }
    
    // Add wispy effects around the perimeter
    for (let i = 0; i < 24; i++) {
      const angle1 = (i / 24) * Math.PI * 2;
      const angle2 = ((i + 0.5) / 24) * Math.PI * 2;
      
      const x1 = x + Math.cos(angle1) * (pulseRadius * (0.95 + Math.random() * 0.1));
      const y1 = y + Math.sin(angle1) * (pulseRadius * (0.95 + Math.random() * 0.1));
      const x2 = x + Math.cos(angle2) * (pulseRadius * (1.05 + Math.random() * 0.1));
      const y2 = y + Math.sin(angle2) * (pulseRadius * (1.05 + Math.random() * 0.1));
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `${baseColor} ${pulseOpacity * 0.7})`;
      ctx.stroke();
    }
    
    ctx.restore();
  } catch (error) {
    console.warn('Error rendering pulse effect:', error);
    
    // Simple fallback rendering
    try {
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x - cameraX, player.y - cameraY, gameConstants.GRAVITY_RANGE * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = player.isTagged ? 'rgba(255, 107, 107, 0.8)' : 'rgba(81, 131, 245, 0.8)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();
    } catch (e) {
      // If even this fails, do nothing
    }
  }
};
