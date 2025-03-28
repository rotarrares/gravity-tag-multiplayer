import { COLOR_PALETTES } from '../utils/colorUtils';
import { drawDashedCircle, drawGradientCircle } from '../utils/canvasUtils';

/**
 * Render a player on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player object
 * @param {boolean} isCurrentPlayer - Whether this is the current player
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderPlayer = (ctx, player, isCurrentPlayer, cameraX, cameraY, gameConstants) => {
  const x = player.x - cameraX;
  const y = player.y - cameraY;
  
  ctx.save();
  
  // Determine player colors based on tagged state
  const palette = player.isTagged ? COLOR_PALETTES.tagged : COLOR_PALETTES.player;
  const fillColor = isCurrentPlayer ? palette.base : palette.light;
  const strokeColor = isCurrentPlayer ? '#ffffff' : '#c8d8ff';
  
  // Draw player body (gradient circle)
  drawGradientCircle(
    ctx, 
    x, 
    y, 
    gameConstants.PLAYER_RADIUS,
    fillColor,
    palette.dark
  );
  
  // Add outer glow for current player
  if (isCurrentPlayer) {
    ctx.beginPath();
    ctx.arc(x, y, gameConstants.PLAYER_RADIUS + 1, 0, Math.PI * 2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Add invulnerability indicator if recently tagged
  const now = Date.now();
  if (now - player.lastTaggedTime < gameConstants.TAG_INVULNERABILITY) {
    // Calculate pulse effect based on time
    const timeSinceTagged = now - player.lastTaggedTime;
    const pulseProgress = (timeSinceTagged % 500) / 500; // 0 to 1 every 500ms
    const pulseSize = 3 + pulseProgress * 3;
    
    drawDashedCircle(
      ctx,
      x,
      y,
      gameConstants.PLAYER_RADIUS + pulseSize,
      [5, 5],
      'rgba(255, 255, 255, 0.6)',
      2
    );
  }
  
  ctx.restore();
};

/**
 * Render player's username and score
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player object
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderPlayerName = (ctx, player, cameraX, cameraY, gameConstants) => {
  const x = player.x - cameraX;
  const y = player.y - cameraY - gameConstants.PLAYER_RADIUS - 15;
  
  ctx.save();
  
  // Draw username
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText(player.username, x, y);
  
  // Draw score
  ctx.font = '12px Arial';
  ctx.fillStyle = '#a5b9f8';
  ctx.fillText(`Score: ${player.score}`, x, y + 15);
  
  ctx.restore();
};

/**
 * Render player's gravity well
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} player - Player object
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {Object} gameConstants - Game constants
 */
export const renderGravityWell = (ctx, player, cameraX, cameraY, gameConstants) => {
  const x = player.x - cameraX;
  const y = player.y - cameraY;
  
  // Skip rendering if player has no gravity
  if (player.gravityStrength <= 0) return;
  
  // Determine color based on player state
  const palette = player.isTagged ? COLOR_PALETTES.tagged : COLOR_PALETTES.player;
  
  // Adjust opacity based on gravity strength
  const normalizedStrength = player.gravityStrength / gameConstants.BASE_GRAVITY_STRENGTH;
  const wellRadius = gameConstants.GRAVITY_RANGE;
  
  // Create gradient for gravity well effect
  const gradient = ctx.createRadialGradient(
    x, y, 0,
    x, y, wellRadius
  );
  
  gradient.addColorStop(0, palette.transparent);
  gradient.addColorStop(0.7, palette.veryTransparent);
  gradient.addColorStop(1, `${palette.base}00`); // 00 = 0% opacity
  
  ctx.beginPath();
  ctx.arc(x, y, wellRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw ripple effect
  const time = Date.now() / 1000;
  for (let i = 1; i <= 3; i++) {
    const rippleSize = wellRadius * 0.3 * i;
    const rippleOffset = (time * i) % 1; // 0 to 1 based on time
    const rippleRadius = rippleSize + rippleOffset * (wellRadius - rippleSize);
    
    if (rippleRadius < wellRadius) {
      ctx.beginPath();
      ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${palette.base}${Math.floor((1 - rippleOffset) * 40).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
};