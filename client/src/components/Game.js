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
  const [loadingError, setLoadingError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Key state tracking
  const keysPressed = useRef({});
  const lastDirection = useRef({ x: 0, y: 0 });
  
  // Setup a loading timeout
  useEffect(() => {
    // If game constants aren't set after 15 seconds, show a timeout message
    const timer = setTimeout(() => {
      if (!gameConstants) {
        setLoadingTimeout(true);
      }
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [gameConstants]);

  // Request game constants on component mount if not already set
  useEffect(() => {
    if (!socket || gameConstants) return;
    
    console.log('Requesting game constants for roomId:', roomId);
    socket.emit('requestGameConstants', { roomId });
  }, [socket, roomId, gameConstants]);
  
  useEffect(() => {
    if (!socket) return;
    
    console.log('Setting up event listeners with socket ID:', socket.id);
    
    // Handle game state updates
    const handleGameState = (state) => {
      console.log('Game state update received');
      setGameState(state);
    };
    
    // Handle room joined event
    const handleRoomJoined = (data) => {
      console.log('Room joined event received:', data);
      if (data && data.gameConstants) {
        console.log('Game constants received:', data.gameConstants);
        setGameConstants(data.gameConstants);
      } else {
        console.error('Missing game constants in roomJoined event');
        setLoadingError('Missing game data. Please try again.');
      }
    };
    
    // Handle direct game constants response
    const handleGameConstants = (data) => {
      console.log('Direct game constants received:', data);
      if (data) {
        setGameConstants(data);
      }
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
    
    // Handle errors
    const handleError = (error) => {
      console.error('Socket error:', error);
      setLoadingError(`Error: ${error.message || 'Unknown error'}`);
    };
    
    // Set up event listeners
    socket.on('gameState', handleGameState);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('gameConstants', handleGameConstants);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('pulseTriggered', handlePulseTriggered);
    socket.on('collapseTriggered', handleCollapseTriggered);
    socket.on('error', handleError);
    
    // Emit a join room event to re-establish connection if needed
    if (roomId && playerId) {
      console.log('Re-joining room:', roomId);
      socket.emit('joinGame', {
        username,
        roomId
      });
    }
    
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
      socket.off('gameConstants', handleGameConstants);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('pulseTriggered', handlePulseTriggered);
      socket.off('collapseTriggered', handleCollapseTriggered);
      socket.off('error', handleError);
      
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, roomId, username, playerId]);
  
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
  
  // Force proceed with default constants if needed (as a fallback)
  const handleForceStart = () => {
    // Default game constants if server doesn't provide them
    const defaultConstants = {
      WORLD_WIDTH: 1200,
      WORLD_HEIGHT: 800,
      PLAYER_RADIUS: 20,
      PLAYER_SPEED: 3,
      GRAVITY_MAX: 5,
      GRAVITY_RANGE: 200,
      PULSE_COOLDOWN: 5000,
      COLLAPSE_COOLDOWN: 15000,
      PULSE_DURATION: 1000,
      COLLAPSE_DURATION: 3000,
      TICK_RATE: 16,
      HAZARD_COUNT: 5
    };
    
    setGameConstants(defaultConstants);
  };
  
  // Check if game constants have been loaded
  if (!gameConstants) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
        
        {loadingError && (
          <div className="loading-error">
            <p>{loadingError}</p>
            <button onClick={handleExitGame}>Go Back</button>
          </div>
        )}
        
        {loadingTimeout && !loadingError && (
          <div className="loading-timeout">
            <p>Game is taking longer than expected to load.</p>
            <div className="loading-actions">
              <button onClick={handleExitGame}>Go Back</button>
              <button onClick={handleForceStart}>Start Anyway</button>
            </div>
          </div>
        )}
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