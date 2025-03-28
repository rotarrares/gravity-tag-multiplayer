import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import GameCanvas from './GameCanvas';
import GameUI from './GameUI';
import './Game.css';

const Game = ({ username, roomId, playerId, onExitGame }) => {
  const { socket } = useSocket();
  const [gameState, setGameState] = useState({
    players: {},
    hazards: [],
    timeRemaining: 0
  });
  const [gameConstants, setGameConstants] = useState(null);
  const [players, setPlayers] = useState([]);
  const [latestJoin, setLatestJoin] = useState(null);
  const [latestLeave, setLatestLeave] = useState(null);
  const [pulseTriggered, setPulseTriggered] = useState(null);
  const [collapseTriggered, setCollapseTriggered] = useState(null);
  
  // Key state tracking
  const keysPressed = useRef({});
  const lastDirection = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!socket) return;
    
    // Handle game state updates
    const handleGameState = (state) => {
      setGameState(state);
    };
    
    // Handle room joined event
    const handleRoomJoined = (data) => {
      setGameConstants(data.gameConstants);
    };
    
    // Handle player joined event
    const handlePlayerJoined = (data) => {
      setLatestJoin(data);
    };
    
    // Handle player left event
    const handlePlayerLeft = (data) => {
      setLatestLeave(data);
    };
    
    // Handle pulse triggered
    const handlePulseTriggered = (data) => {
      setPulseTriggered(data);
      // Reset after animation time
      setTimeout(() => setPulseTriggered(null), 1000);
    };
    
    // Handle collapse triggered
    const handleCollapseTriggered = (data) => {
      setCollapseTriggered(data);
      // Reset after animation time
      setTimeout(() => setCollapseTriggered(null), 3000);
    };
    
    // Set up event listeners
    socket.on('gameState', handleGameState);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('pulseTriggered', handlePulseTriggered);
    socket.on('collapseTriggered', handleCollapseTriggered);
    
    // Set up keyboard event listeners for movement
    const handleKeyDown = (e) => {
      if (e.repeat) return; // Ignore key repeat events
      
      keysPressed.current[e.key] = true;
      
      // Handle gravity pulse (Space)
      if (e.code === 'Space') {
        socket.emit('gravityPulse', { roomId });
      }
      
      // Handle gravity collapse (E)
      if (e.key === 'e' || e.key === 'E') {
        socket.emit('gravityCollapse', { roomId });
      }
      
      updateMovementDirection();
    };
    
    const handleKeyUp = (e) => {
      delete keysPressed.current[e.key];
      updateMovementDirection();
    };
    
    // Calculate and send movement direction based on keys pressed
    const updateMovementDirection = () => {
      const keys = keysPressed.current;
      let direction = { x: 0, y: 0 };
      
      // Check arrow keys and WASD
      if (keys['ArrowUp'] || keys['w'] || keys['W']) direction.y -= 1;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) direction.y += 1;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) direction.x -= 1;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) direction.x += 1;
      
      // Normalize for diagonal movement
      if (direction.x !== 0 && direction.y !== 0) {
        const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        direction.x /= magnitude;
        direction.y /= magnitude;
      }
      
      // Only send update if direction changed
      if (direction.x !== lastDirection.current.x || direction.y !== lastDirection.current.y) {
        lastDirection.current = direction;
        socket.emit('playerMove', { roomId, direction });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup function
    return () => {
      socket.off('gameState', handleGameState);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('pulseTriggered', handlePulseTriggered);
      socket.off('collapseTriggered', handleCollapseTriggered);
      
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, roomId]);
  
  // Convert players object to array for leaderboard
  useEffect(() => {
    if (gameState.players) {
      const playerArray = Object.values(gameState.players).map(player => ({
        id: player.id,
        username: player.username,
        score: player.score,
        isTagged: player.isTagged,
        energy: player.energy
      }));
      
      // Sort by score in descending order
      playerArray.sort((a, b) => b.score - a.score);
      setPlayers(playerArray);
    }
  }, [gameState.players]);
  
  const handleExitGame = () => {
    if (socket) {
      socket.disconnect();
    }
    onExitGame();
  };
  
  // Format time remaining
  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Check if game constants have been loaded
  if (!gameConstants) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }
  
  return (
    <div className="game-container">
      <GameCanvas 
        gameState={gameState} 
        playerId={playerId}
        gameConstants={gameConstants}
        pulseTriggered={pulseTriggered}
        collapseTriggered={collapseTriggered}
      />
      
      <GameUI 
        players={players}
        playerId={playerId}
        timeRemaining={formatTime(gameState.timeRemaining)}
        roomId={roomId}
        onExitGame={handleExitGame}
        latestJoin={latestJoin}
        latestLeave={latestLeave}
        playerData={gameState.players[playerId]}
        gameConstants={gameConstants}
      />
    </div>
  );
};

export default Game;