import React, { useRef, useEffect } from 'react';
import './GameCanvas.css';

const GameCanvas = ({ gameState, playerId, gameConstants, pulseTriggered, collapseTriggered }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Draw the game on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState.players || !gameState.players[playerId] || !gameConstants) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const player = gameState.players[playerId];
    
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Camera follows player (center of the screen)
    const cameraX = player.x - canvas.width / 2;
    const cameraY = player.y - canvas.height / 2;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (star field)
    drawStarField(ctx, canvas.width, canvas.height, cameraX, cameraY);
    
    // Draw arena boundaries
    drawArenaBoundaries(ctx, gameConstants, cameraX, cameraY);
    
    // Draw hazards
    gameState.hazards.forEach(hazard => {
      drawHazard(ctx, hazard, cameraX, cameraY);
    });
    
    // Draw all players
    Object.values(gameState.players).forEach(p => {
      drawPlayer(ctx, p, p.id === playerId, cameraX, cameraY);
      
      // Draw gravity wells
      drawGravityWell(ctx, p, cameraX, cameraY);
      
      // Draw pulse effect if triggered
      if (pulseTriggered && pulseTriggered.playerId === p.id) {
        drawPulseEffect(ctx, p, cameraX, cameraY);
      }
      
      // Draw collapse effect if triggered
      if (collapseTriggered && collapseTriggered.playerId === p.id) {
        drawCollapseEffect(ctx, p, cameraX, cameraY);
      }
    });
    
    // Draw player names
    Object.values(gameState.players).forEach(p => {
      drawPlayerName(ctx, p, cameraX, cameraY);
    });
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(() => {
      // This empty callback is just to keep the animation loop running
    });
    
  }, [gameState, playerId, gameConstants, pulseTriggered, collapseTriggered]);
  
  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Function to draw a star field
  const drawStarField = (ctx, width, height, cameraX, cameraY) => {
    // Generate pseudo-random stars based on camera position
    ctx.fillStyle = '#0f1123';
    ctx.fillRect(0, 0, width, height);
    
    // Use a fixed seed for consistent star positions
    const starSeed = 12345;
    const starCount = 500;
    
    for (let i = 0; i < starCount; i++) {
      // Pseudo-random position based on index and seed
      const x = ((starSeed * (i + 1) * 17) % gameConstants.ARENA_WIDTH) - cameraX;
      const y = ((starSeed * (i + 1) * 23) % gameConstants.ARENA_HEIGHT) - cameraY;
      
      // Only draw stars within viewport
      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        // Vary star sizes
        const size = ((i % 3) + 1) * 0.5;
        
        // Vary star brightness
        const brightness = 155 + ((i * 100) % 100);
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 40})`;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  
  // Function to draw arena boundaries
  const drawArenaBoundaries = (ctx, gameConstants, cameraX, cameraY) => {
    ctx.strokeStyle = 'rgba(81, 131, 245, 0.3)';
    ctx.lineWidth = 5;
    
    // Draw hexagonal or circular arena based on shape setting
    if (gameConstants.ARENA_SHAPE === 'hexagon') {
      const centerX = gameConstants.ARENA_WIDTH / 2 - cameraX;
      const centerY = gameConstants.ARENA_HEIGHT / 2 - cameraY;
      const radius = Math.min(gameConstants.ARENA_WIDTH, gameConstants.ARENA_HEIGHT) / 2;
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
    } else {
      // Circular arena
      const centerX = gameConstants.ARENA_WIDTH / 2 - cameraX;
      const centerY = gameConstants.ARENA_HEIGHT / 2 - cameraY;
      const radius = Math.min(gameConstants.ARENA_WIDTH, gameConstants.ARENA_HEIGHT) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  
  // Function to draw a player
  const drawPlayer = (ctx, player, isCurrentPlayer, cameraX, cameraY) => {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Draw player circle
    ctx.beginPath();
    
    // Different color for current player vs others
    if (isCurrentPlayer) {
      ctx.fillStyle = player.isTagged ? '#ff6b6b' : '#5183f5';
    } else {
      ctx.fillStyle = player.isTagged ? '#ff9e9e' : '#a5b9f8';
    }
    
    ctx.arc(x, y, gameConstants.PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a border
    ctx.strokeStyle = isCurrentPlayer ? '#ffffff' : '#c8d8ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add invulnerability indicator if recently tagged
    const now = Date.now();
    if (now - player.lastTaggedTime < gameConstants.TAG_INVULNERABILITY) {
      ctx.beginPath();
      ctx.arc(x, y, gameConstants.PLAYER_RADIUS + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };
  
  // Function to draw gravity well
  const drawGravityWell = (ctx, player, cameraX, cameraY) => {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Adjust radius based on gravity strength
    const wellRadius = gameConstants.GRAVITY_RANGE;
    
    // Create gradient for gravity well effect
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, wellRadius
    );
    
    // Determine color based on player state
    let color = player.isTagged ? '#ff6b6b' : '#5183f5';
    
    // Adjust opacity based on strength
    const normalizedStrength = player.gravityStrength / gameConstants.BASE_GRAVITY_STRENGTH;
    const opacity = Math.min(0.5, normalizedStrength * 0.2);
    
    gradient.addColorStop(0, `${color}50`);  // 50 = 31% opacity in hex
    gradient.addColorStop(0.7, `${color}20`); // 20 = 12% opacity in hex
    gradient.addColorStop(1, `${color}00`);   // 00 = 0% opacity in hex
    
    ctx.beginPath();
    ctx.arc(x, y, wellRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  };
  
  // Function to draw pulse effect
  const drawPulseEffect = (ctx, player, cameraX, cameraY) => {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Calculate pulse animation progress (0 to 1)
    const pulseElapsed = Date.now() - player.pulseStartTime;
    const pulseProgress = Math.min(1, pulseElapsed / gameConstants.PULSE_DURATION);
    
    // Expand and fade out
    const pulseRadius = gameConstants.GRAVITY_RANGE * pulseProgress * 1.5;
    const pulseOpacity = 1 - pulseProgress;
    
    // Draw pulse wave
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(81, 131, 245, ${pulseOpacity})`;
    ctx.lineWidth = 5 * (1 - pulseProgress);
    ctx.stroke();
  };
  
  // Function to draw collapse effect
  const drawCollapseEffect = (ctx, player, cameraX, cameraY) => {
    const x = player.x - cameraX;
    const y = player.y - cameraY;
    
    // Calculate collapse animation progress (0 to 1)
    const collapseElapsed = Date.now() - player.collapseStartTime;
    const collapseProgress = collapseElapsed / gameConstants.COLLAPSE_DURATION;
    
    if (collapseProgress <= 0.5) {
      // First half: implode (shrink to center)
      const implodeProgress = collapseProgress * 2; // 0 to 1
      const implodeRadius = gameConstants.GRAVITY_RANGE * (1 - implodeProgress);
      
      // Draw imploding circles
      for (let i = 0; i < 3; i++) {
        const radius = implodeRadius - (i * 10);
        if (radius > 0) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 - (i * 0.2)})`;
          ctx.lineWidth = 3 - i;
          ctx.stroke();
        }
      }
    } else {
      // Second half: explode (expand from center)
      const explodeProgress = (collapseProgress - 0.5) * 2; // 0 to 1
      const explodeRadius = gameConstants.GRAVITY_RANGE * explodeProgress * 2;
      
      // Draw shockwave
      ctx.beginPath();
      ctx.arc(x, y, explodeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - explodeProgress})`;
      ctx.lineWidth = 5 * (1 - explodeProgress);
      ctx.stroke();
      
      // Draw additional inner shockwaves
      for (let i = 1; i <= 2; i++) {
        const innerRadius = explodeRadius * (1 - (i * 0.2));
        if (innerRadius > 0) {
          ctx.beginPath();
          ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100, 150, 255, ${(1 - explodeProgress) * 0.7})`;
          ctx.lineWidth = 3 * (1 - explodeProgress);
          ctx.stroke();
        }
      }
    }
  };
  
  // Function to draw player names
  const drawPlayerName = (ctx, player, cameraX, cameraY) => {
    const x = player.x - cameraX;
    const y = player.y - cameraY - gameConstants.PLAYER_RADIUS - 15;
    
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText(player.username, x, y);
    
    // Draw score under the name
    ctx.font = '12px Arial';
    ctx.fillStyle = '#a5b9f8';
    ctx.fillText(`Score: ${player.score}`, x, y + 15);
  };
  
  // Function to draw hazard
  const drawHazard = (ctx, hazard, cameraX, cameraY) => {
    const x = hazard.x - cameraX;
    const y = hazard.y - cameraY;
    
    if (hazard.type === 'blackHole') {
      // Draw black hole
      ctx.beginPath();
      
      // Create gradient for black hole
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, hazard.radius
      );
      
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.7, 'rgba(30, 0, 60, 0.8)');
      gradient.addColorStop(1, 'rgba(60, 0, 120, 0)');
      
      ctx.arc(x, y, hazard.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw accretion disk
      ctx.beginPath();
      ctx.ellipse(x, y, hazard.radius * 1.5, hazard.radius, Date.now() / 5000, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200, 50, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
    } else if (hazard.type === 'nebula') {
      // Draw nebula
      ctx.beginPath();
      
      // Create gradient for nebula
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, hazard.radius
      );
      
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.2)');
      gradient.addColorStop(0.7, 'rgba(70, 130, 200, 0.1)');
      gradient.addColorStop(1, 'rgba(50, 100, 150, 0)');
      
      ctx.arc(x, y, hazard.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add some nebula "cloudiness"
      for (let i = 0; i < 5; i++) {
        const cloudX = x + Math.cos(Date.now() / 1000 + i) * hazard.radius * 0.5;
        const cloudY = y + Math.sin(Date.now() / 1500 + i) * hazard.radius * 0.5;
        const cloudSize = hazard.radius * 0.4;
        
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 220, 255, 0.1)';
        ctx.fill();
      }
      
    } else if (hazard.type === 'comet') {
      // Draw comet
      ctx.beginPath();
      ctx.arc(x, y, hazard.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      
      // Draw comet tail
      const tailLength = hazard.radius * 10;
      const angle = Math.atan2(hazard.velocityY, hazard.velocityX);
      
      // Create gradient for comet tail
      const tailGradient = ctx.createLinearGradient(
        x, y,
        x - Math.cos(angle) * tailLength,
        y - Math.sin(angle) * tailLength
      );
      
      tailGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      tailGradient.addColorStop(0.4, 'rgba(200, 200, 255, 0.4)');
      tailGradient.addColorStop(1, 'rgba(150, 150, 255, 0)');
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Draw a tapered tail
      const tailWidth = hazard.radius * 0.8;
      const perpX = Math.sin(angle) * tailWidth;
      const perpY = -Math.cos(angle) * tailWidth;
      
      ctx.lineTo(
        x - Math.cos(angle) * tailLength + perpX,
        y - Math.sin(angle) * tailLength + perpY
      );
      
      ctx.lineTo(
        x - Math.cos(angle) * tailLength - perpX,
        y - Math.sin(angle) * tailLength - perpY
      );
      
      ctx.closePath();
      ctx.fillStyle = tailGradient;
      ctx.fill();
    }
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="game-canvas"
    />
  );
};

export default GameCanvas;