import React, { useRef, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import Graphics from '../graphics/Graphics';
import './GameCanvas.css';

const GameCanvas = ({ gameState, playerId, gameConstants, pulseTriggered, collapseTriggered }) => {
  const canvasRef = useRef(null);
  const graphicsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const { socket } = useSocket();
  const lastTapTimeRef = useRef(0);
  const activeTouchRef = useRef(null);
  
  // Initialize graphics when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !graphicsRef.current) {
      graphicsRef.current = new Graphics(canvasRef.current);
    }
    
    return () => {
      if (graphicsRef.current) {
        graphicsRef.current.clear();
      }
    };
  }, []);
  
  // Draw the game using our Graphics engine
  useEffect(() => {
    if (!canvasRef.current || !graphicsRef.current || !gameState.players || !gameState.players[playerId] || !gameConstants) {
      return;
    }
    
    // Prepare special effects data
    const effects = {
      pulseTriggered,
      collapseTriggered
    };
    
    // Render the game
    const render = () => {
      graphicsRef.current.render(gameState, playerId, gameConstants, effects);
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    // Start render loop
    render();
    
    // Clean up animation frame on unmount or when dependencies change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, playerId, gameConstants, pulseTriggered, collapseTriggered]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphicsRef.current) {
        graphicsRef.current.updateCanvasSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle touch events for mobile movement
  const handleTouchStart = (e) => {
    // Prevent default to avoid scrolling
    e.preventDefault();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // Store this touch as the active one
      activeTouchRef.current = {
        identifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        isMoving: false
      };
      
      // Handle double tap for gravity pulse
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double tap detected, trigger gravity pulse
        if (socket) {
          socket.emit('gravityPulse', { roomId: gameState.roomId });
        }
      }
      lastTapTimeRef.current = now;
    }
  };
  
  const handleTouchMove = (e) => {
    e.preventDefault();
    
    // Find our active touch
    if (!activeTouchRef.current) return;
    
    const activeTouch = Array.from(e.touches).find(
      touch => touch.identifier === activeTouchRef.current.identifier
    );
    
    if (activeTouch) {
      // Update the active touch position
      activeTouchRef.current.lastX = activeTouch.clientX;
      activeTouchRef.current.lastY = activeTouch.clientY;
      activeTouchRef.current.isMoving = true;
      
      // Calculate movement direction if we have player info and socket
      if (socket && gameState.players && gameState.players[playerId] && graphicsRef.current) {
        const canvas = canvasRef.current;
        const player = gameState.players[playerId];
        
        // Get the canvas coordinates
        const rect = canvas.getBoundingClientRect();
        
        // Convert touch position to canvas coordinates
        const touchX = activeTouch.clientX - rect.left;
        const touchY = activeTouch.clientY - rect.top;
        
        // Convert to world coordinates based on player position and camera
        const cameraX = player.x - canvas.width / 2;
        const cameraY = player.y - canvas.height / 2;
        
        // Calculate direction from player to touch point
        const targetX = touchX + cameraX;
        const targetY = touchY + cameraY;
        
        // Calculate direction vector
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        
        // Normalize direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const direction = {
            x: dx / distance,
            y: dy / distance
          };
          
          // Send the movement direction to the server
          socket.emit('playerMove', {
            roomId: gameState.roomId,
            direction: direction
          });
        }
      }
    }
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault();
    
    // Check if this is our active touch ending
    if (!activeTouchRef.current) return;
    
    // If the touch wasn't moving much, treat it as a tap
    if (!activeTouchRef.current.isMoving) {
      if (socket && gameState.players && gameState.players[playerId] && canvasRef.current) {
        const canvas = canvasRef.current;
        const player = gameState.players[playerId];
        
        // Get the canvas coordinates
        const rect = canvas.getBoundingClientRect();
        
        // Convert tap position to canvas coordinates
        const tapX = activeTouchRef.current.lastX - rect.left;
        const tapY = activeTouchRef.current.lastY - rect.top;
        
        // Convert to world coordinates based on player position and camera
        const cameraX = player.x - canvas.width / 2;
        const cameraY = player.y - canvas.height / 2;
        
        // Calculate tap point in world coordinates
        const worldTapX = tapX + cameraX;
        const worldTapY = tapY + cameraY;
        
        // Calculate direction from player to tap point
        const dx = worldTapX - player.x;
        const dy = worldTapY - player.y;
        
        // Normalize direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const direction = {
            x: dx / distance,
            y: dy / distance
          };
          
          // Send the movement direction to the server
          socket.emit('playerMove', {
            roomId: gameState.roomId,
            direction: direction
          });
          
          // Set a timeout to stop movement after a short duration
          setTimeout(() => {
            if (socket) {
              socket.emit('playerMove', {
                roomId: gameState.roomId,
                direction: { x: 0, y: 0 }
              });
            }
          }, 500); // Stop after 500ms
        }
      }
    } else {
      // If touch was moving and is now ending, stop the player
      if (socket) {
        socket.emit('playerMove', {
          roomId: gameState.roomId,
          direction: { x: 0, y: 0 }
        });
      }
    }
    
    // Clear active touch
    activeTouchRef.current = null;
  };
  
  // Handle long press for gravity collapse
  useEffect(() => {
    let longPressTimer = null;
    
    // Start timer on touch start
    const handleTouchStartLongPress = (e) => {
      if (e.touches.length === 1) {
        longPressTimer = setTimeout(() => {
          // Long press detected, trigger gravity collapse
          if (socket) {
            socket.emit('gravityCollapse', { roomId: gameState.roomId });
          }
        }, 800); // 800ms for long press
      }
    };
    
    // Clear timer if touch moves too much or ends
    const handleTouchMoveLongPress = (e) => {
      if (activeTouchRef.current && activeTouchRef.current.isMoving) {
        clearTimeout(longPressTimer);
      }
    };
    
    const handleTouchEndLongPress = () => {
      clearTimeout(longPressTimer);
    };
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStartLongPress);
      canvas.addEventListener('touchmove', handleTouchMoveLongPress);
      canvas.addEventListener('touchend', handleTouchEndLongPress);
      canvas.addEventListener('touchcancel', handleTouchEndLongPress);
    }
    
    return () => {
      clearTimeout(longPressTimer);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStartLongPress);
        canvas.removeEventListener('touchmove', handleTouchMoveLongPress);
        canvas.removeEventListener('touchend', handleTouchEndLongPress);
        canvas.removeEventListener('touchcancel', handleTouchEndLongPress);
      }
    };
  }, [socket, gameState.roomId]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="game-canvas"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    />
  );
};

export default GameCanvas;