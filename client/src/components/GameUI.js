import React, { useState, useEffect } from 'react';
import './GameUI.css';

const GameUI = ({ 
  players, 
  playerId, 
  timeRemaining, 
  roomId, 
  onExitGame, 
  latestJoin, 
  latestLeave,
  playerData,
  gameConstants,
  isMobile
}) => {
  const [showRoomId, setShowRoomId] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showControls, setShowControls] = useState(false);
  
  // Handle player join/leave notifications
  useEffect(() => {
    if (latestJoin) {
      setNotification({
        message: `${latestJoin.username} joined the game`,
        type: 'join',
        timestamp: Date.now()
      });
    }
  }, [latestJoin]);
  
  useEffect(() => {
    if (latestLeave) {
      setNotification({
        message: `${latestLeave.id.substring(0, 4)}... left the game`,
        type: 'leave',
        timestamp: Date.now()
      });
    }
  }, [latestLeave]);
  
  // Clear notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Check if the player is in "gravity storm" (last 30 seconds)
  const isInGravityStorm = playerData && gameConstants && 
    parseInt(timeRemaining.split(':')[0]) === 0 && 
    parseInt(timeRemaining.split(':')[1]) <= 30;
  
  // Format the current player's energy
  const energyPercentage = playerData ? (playerData.energy / gameConstants.MAX_ENERGY) * 100 : 0;
  
  // Get current player's position in leaderboard
  const playerRank = players.findIndex(p => p.id === playerId) + 1;
  
  // Show mobile tutorial on first load for mobile users
  useEffect(() => {
    if (isMobile) {
      setShowControls(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile]);
  
  return (
    <div className="game-ui">
      {/* Timer */}
      <div className={`game-timer ${isInGravityStorm ? 'gravity-storm' : ''}`}>
        {isInGravityStorm && <span className="gravity-storm-text">GRAVITY STORM!</span>}
        <span className="time">{timeRemaining}</span>
      </div>
      
      {/* Notifications */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Room info */}
      <div className="room-info">
        <button className="room-id-toggle" onClick={() => setShowRoomId(!showRoomId)}>
          {showRoomId ? 'Hide Room ID' : 'Show Room ID'}
        </button>
        
        {showRoomId && (
          <div className="room-id-display">
            <p>Room ID: <span className="highlight">{roomId}</span></p>
            <p>Share this ID with friends to let them join your game</p>
          </div>
        )}
      </div>
      
      {/* Energy meter */}
      {playerData && (
        <div className="energy-meter">
          <div className="energy-label">ENERGY</div>
          <div className="energy-bar">
            <div 
              className="energy-fill" 
              style={{ width: `${energyPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Ability cooldowns */}
      {playerData && (
        <div className="ability-cooldowns">
          <div className="ability pulse">
            <div className="ability-icon">P</div>
            <div className="ability-name">Pulse</div>
            <div className="ability-status">
              {Date.now() - playerData.lastPulseTime < gameConstants.PULSE_COOLDOWN
                ? ((gameConstants.PULSE_COOLDOWN - (Date.now() - playerData.lastPulseTime)) / 1000).toFixed(1) + 's'
                : 'Ready'}
            </div>
          </div>
          
          <div className="ability collapse">
            <div className="ability-icon">C</div>
            <div className="ability-name">Collapse</div>
            <div className="ability-status">
              {Date.now() - playerData.lastCollapseTime < gameConstants.COLLAPSE_COOLDOWN
                ? ((gameConstants.COLLAPSE_COOLDOWN - (Date.now() - playerData.lastCollapseTime)) / 1000).toFixed(1) + 's'
                : 'Ready'}
            </div>
          </div>
        </div>
      )}
      
      {/* Leaderboard */}
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3>LEADERBOARD</h3>
          <div className="player-count">{players.length} Players</div>
        </div>
        
        <div className="leaderboard-body">
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className={`leaderboard-row ${player.id === playerId ? 'current-player' : ''} ${player.isTagged ? 'tagged' : ''}`}
            >
              <div className="player-rank">{index + 1}</div>
              <div className="player-name">{player.username}</div>
              <div className="player-score">{player.score}</div>
            </div>
          ))}
        </div>
        
        {playerRank > 5 && (
          <div className="current-player-rank">
            Your Rank: {playerRank} / {players.length}
          </div>
        )}
      </div>
      
      {/* Controls toggle */}
      <div className="controls-toggle">
        <button onClick={() => setShowControls(!showControls)}>
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>
      
      {/* Controls help */}
      {showControls && (
        <div className="controls-help">
          <h3>Controls</h3>
          {isMobile ? (
            <ul>
              <li><strong>Tap</strong> anywhere to move in that direction</li>
              <li><strong>Double-tap</strong> to activate gravity pulse</li>
              <li><strong>Long press</strong> (hold 0.8s) for gravity collapse</li>
            </ul>
          ) : (
            <ul>
              <li><span className="key">WASD</span> or <span className="key">Arrow Keys</span> to move</li>
              <li><span className="key">Space</span> to activate gravity pulse</li>
              <li><span className="key">E</span> for gravity collapse</li>
            </ul>
          )}
          <h3>Tips</h3>
          <ul>
            <li>Standing still increases your gravity pull</li>
            <li>Avoid black holes at all costs</li>
            <li>Hide in nebulae to reduce gravity effects</li>
            <li>Watch out for comets!</li>
          </ul>
        </div>
      )}
      
      {/* Exit button */}
      <div className="exit-game">
        <button onClick={onExitGame}>Exit Game</button>
      </div>

      {/* Mobile indicator */}
      {isMobile && (
        <div className="mobile-indicator">
          <span>Mobile Mode</span>
        </div>
      )}
    </div>
  );
};

export default GameUI;