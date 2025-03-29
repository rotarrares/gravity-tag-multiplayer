import { easeInOutQuad, easeInQuad, easeOutQuad } from '../utils/mathUtils';

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
 * Render a gravity collapse effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player that triggered the collapse
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderCollapseEffect = (ctx, player, cameraX, cameraY, gameConstants) => {
  // Basic validation
  if (!ctx || !player || !gameConstants) return;
  
  try {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Calculate collapse animation progress (0 to 1)
    const collapseElapsed = Date.now() - player.collapseStartTime;
    const collapseProgress = Math.min(1, collapseElapsed / gameConstants.COLLAPSE_DURATION);
    
    ctx.save();
    
    // Determine color based on player state
    const baseColor = player.isTagged ? 
      'rgba(255, 107, 107,' : 
      'rgba(81, 131, 245,';
    const whiteColor = 'rgba(255, 255, 255,';
    
    if (collapseProgress <= 0.5) {
      // First half: implode (shrink to center)
      const implodeProgress = collapseProgress * 2; // 0 to 1
      const easedImplode = easeInQuad(implodeProgress);
      const implodeRadius = gameConstants.GRAVITY_RANGE * (1 - easedImplode);
      
      // Create an intense glow that grows as the implosion progresses
      const glowRadius = gameConstants.PLAYER_RADIUS * (1 + easedImplode * 3);
      
      // Central glow
      ctx.beginPath();
      safeArc(ctx, x, y, glowRadius);
      ctx.fillStyle = `${whiteColor} ${0.7 * easedImplode})`;
      ctx.fill();
      
      // Outer glow
      ctx.beginPath();
      safeArc(ctx, x, y, glowRadius * 1.5);
      ctx.fillStyle = `${baseColor} ${0.5 * easedImplode})`;
      ctx.fill();
      
      // Draw imploding rings that get smaller and faster
      for (let i = 0; i < 4; i++) {
        const ringProgress = Math.min(1, (implodeProgress + i * 0.2) % 1);
        const ringRadius = implodeRadius * (1 - ringProgress * 0.9);
        
        if (ringRadius > 0) {
          ctx.beginPath();
          safeArc(ctx, x, y, ringRadius);
          ctx.strokeStyle = `${whiteColor} ${0.8 - ringProgress * 0.6})`;
          ctx.lineWidth = 3 - ringProgress * 2;
          ctx.stroke();
        }
      }
      
      // Add concentrating energy particles
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        
        // Particles move toward center
        const particleProgress = Math.min(1, (implodeProgress + (i / particleCount) * 0.3) % 1);
        const distance = implodeRadius * (1 - easedImplode * particleProgress);
        
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        const size = 2 * (1 - particleProgress);
        
        ctx.beginPath();
        safeArc(ctx, particleX, particleY, size);
        ctx.fillStyle = `${baseColor} ${0.8 - particleProgress * 0.5})`;
        ctx.fill();
        
        // Add streaks toward center
        if (i % 2 === 0) {
          const innerX = x + Math.cos(angle) * distance * 0.5;
          const innerY = y + Math.sin(angle) * distance * 0.5;
          
          ctx.beginPath();
          ctx.moveTo(particleX, particleY);
          ctx.lineTo(innerX, innerY);
          ctx.strokeStyle = `${whiteColor} ${0.6 - particleProgress * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
    } else {
      // Second half: explode (expand from center)
      const explodeProgress = (collapseProgress - 0.5) * 2; // 0 to 1
      const easedExplode = easeOutQuad(explodeProgress);
      const explodeRadius = gameConstants.GRAVITY_RANGE * easedExplode * 2;
      
      // Central flash at the beginning of explosion
      if (explodeProgress < 0.3) {
        const flashOpacity = 0.9 * (1 - explodeProgress / 0.3);
        const flashRadius = gameConstants.PLAYER_RADIUS * 4 * (0.5 + explodeProgress * 2);
        
        ctx.beginPath();
        safeArc(ctx, x, y, flashRadius);
        ctx.fillStyle = `${whiteColor} ${flashOpacity})`;
        ctx.fill();
        
        ctx.beginPath();
        safeArc(ctx, x, y, flashRadius * 0.7);
        ctx.fillStyle = `${whiteColor} ${flashOpacity * 1.5})`;
        ctx.fill();
      }
      
      // Main shockwave
      ctx.beginPath();
      safeArc(ctx, x, y, explodeRadius);
      ctx.strokeStyle = `${whiteColor} ${1 - easedExplode})`;
      ctx.lineWidth = 8 * (1 - easedExplode);
      ctx.stroke();
      
      // Multiple inner shockwaves
      const waveCount = 3;
      for (let i = 1; i <= waveCount; i++) {
        const waveDelay = i * 0.15;
        const waveProgress = Math.max(0, explodeProgress - waveDelay);
        
        if (waveProgress > 0) {
          const easedWave = easeOutQuad(waveProgress);
          const waveRadius = explodeRadius * easedWave * (1 - (i * 0.2));
          
          if (waveRadius > 0) {
            ctx.beginPath();
            safeArc(ctx, x, y, waveRadius);
            ctx.strokeStyle = `${baseColor} ${(1 - waveProgress) * 0.7})`;
            ctx.lineWidth = (waveCount - i + 1) * (1 - waveProgress);
            ctx.stroke();
          }
        }
      }
      
      // Add explosive energy particles
      const particleCount = 24;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        
        // Some particles move faster than others
        const particleSpeed = 0.8 + (i % 3) * 0.2;
        const distance = explodeRadius * easedExplode * particleSpeed;
        
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        // Particles get smaller as they move outward
        const size = 4 * (1 - easedExplode * particleSpeed);
        
        if (size > 0) {
          ctx.beginPath();
          safeArc(ctx, particleX, particleY, size);
          ctx.fillStyle = i % 3 === 0 ?
            `${whiteColor} ${1 - easedExplode})` :
            `${baseColor} ${1 - easedExplode})`;
          ctx.fill();
          
          // Add streaks for some particles
          if (i % 4 === 0) {
            const innerDistance = distance * 0.7;
            const innerX = x + Math.cos(angle) * innerDistance;
            const innerY = y + Math.sin(angle) * innerDistance;
            
            ctx.beginPath();
            ctx.moveTo(innerX, innerY);
            ctx.lineTo(particleX, particleY);
            ctx.strokeStyle = `${whiteColor} ${0.8 - easedExplode * 0.7})`;
            ctx.lineWidth = 2 * (1 - easedExplode);
            ctx.stroke();
          }
        }
      }
      
      // Add final glow at the center
      ctx.beginPath();
      safeArc(ctx, x, y, gameConstants.PLAYER_RADIUS * 2 * (1 - easedExplode * 0.5));
      ctx.fillStyle = `${whiteColor} ${0.3 * (1 - easedExplode)})`;
      ctx.fill();
    }
    
    ctx.restore();
  } catch (error) {
    console.warn('Error rendering collapse effect:', error);
    
    // Simple fallback rendering
    try {
      ctx.save();
      const radius = gameConstants.PLAYER_RADIUS * 2;
      ctx.beginPath();
      ctx.arc(player.x - cameraX, player.y - cameraY, radius, 0, Math.PI * 2);
      ctx.fillStyle = player.isTagged ? 
        'rgba(255, 107, 107, 0.5)' : 
        'rgba(81, 131, 245, 0.5)';
      ctx.fill();
      ctx.restore();
    } catch (e) {
      // If even this fails, do nothing
    }
  }
};
