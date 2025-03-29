import React, { useRef, useEffect } from 'react';
import Graphics from '../graphics/Graphics';
import './GameCanvas.css';

const GameCanvas = ({ gameState, playerId, gameConstants, pulseTriggered, collapseTriggered }) => {
  const canvasRef = useRef(null);
  const graphicsRef = useRef(null);
  const animationFrameRef = useRef(null);
  
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
  
  return (
    <canvas 
      ref={canvasRef} 
      className="game-canvas"
    />
  );
};

export default GameCanvas;