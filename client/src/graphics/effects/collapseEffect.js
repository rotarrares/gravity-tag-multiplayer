import { easeInOutQuad, easeInQuad, easeOutQuad } from '../utils/mathUtils';

/**
 * Render a gravity collapse effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player that triggered the collapse
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderCollapseEffect = (ctx, player, cameraX, cameraY, gameConstants) => {
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
    const glowGradient = ctx.createRadialGradient(
      x, y, glowRadius * 0.3,
      x, y, glowRadius
    );
    
    glowGradient.addColorStop(0, `${whiteColor} ${0.7 * easedImplode})`);
    glowGradient.addColorStop(0.6, `${baseColor} ${0.5 * easedImplode})`);
    glowGradient.addColorStop(1, `${baseColor} 0)`);
    
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Draw imploding rings that get smaller and faster
    for (let i = 0; i < 4; i++) {
      const ringProgress = Math.min(1, (implodeProgress + i * 0.2) % 1);
      const ringRadius = implodeRadius * (1 - ringProgress * 0.9);
      
      if (ringRadius > 0) {
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
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
      ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
      ctx.fillStyle = `${baseColor} ${0.8 - particleProgress * 0.5})`;
      ctx.fill();
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
      
      const flashGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, flashRadius
      );
      
      flashGradient.addColorStop(0, `${whiteColor} ${flashOpacity})`);
      flashGradient.addColorStop(0.5, `${whiteColor} ${flashOpacity * 0.5})`);
      flashGradient.addColorStop(1, `${whiteColor} 0)`);
      
      ctx.beginPath();
      ctx.arc(x, y, flashRadius, 0, Math.PI * 2);
      ctx.fillStyle = flashGradient;
      ctx.fill();
    }
    
    // Main shockwave
    ctx.beginPath();
    ctx.arc(x, y, explodeRadius, 0, Math.PI * 2);
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
          ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
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
        ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ?
          `${whiteColor} ${1 - easedExplode})` :
          `${baseColor} ${1 - easedExplode})`;
        ctx.fill();
      }
    }
  }
  
  ctx.restore();
};
