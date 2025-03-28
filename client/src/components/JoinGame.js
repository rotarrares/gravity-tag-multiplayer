import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './JoinGame.css';

const JoinGame = ({ onJoinGame }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(true);
  const [error, setError] = useState('');
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Handle successful room join
    const handleRoomJoined = (data) => {
      onJoinGame(username, data.roomId, data.playerId);
    };

    socket.on('roomJoined', handleRoomJoined);

    return () => {
      socket.off('roomJoined', handleRoomJoined);
    };
  }, [socket, username, onJoinGame]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!isCreatingGame && !roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    // Clear any previous errors
    setError('');

    // Join or create game
    socket.emit('joinGame', {
      username: username.trim(),
      roomId: isCreatingGame ? null : roomId.trim()
    });
  };

  return (
    <div className="join-game-container">
      <div className="join-game-card">
        <h1 className="game-title">Gravity Tag</h1>
        <p className="game-subtitle">
          Use gravity wells to outmaneuver opponents in this cosmic game of tag!
        </p>

        <div className="game-mode-toggle">
          <button 
            className={isCreatingGame ? 'active' : ''} 
            onClick={() => setIsCreatingGame(true)}
          >
            Create Game
          </button>
          <button 
            className={!isCreatingGame ? 'active' : ''} 
            onClick={() => setIsCreatingGame(false)}
          >
            Join Game
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your cosmic name"
              maxLength={15}
            />
          </div>

          {!isCreatingGame && (
            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID to join"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={!isConnected}>
            {isCreatingGame ? 'Create Game' : 'Join Game'}
          </button>

          {!isConnected && (
            <div className="connection-status">
              Connecting to server...
            </div>
          )}
        </form>

        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Move with <strong>WASD</strong> or arrow keys</li>
            <li>Stay still to increase your gravity pull</li>
            <li>Press <strong>Space</strong> to activate gravity pulse</li>
            <li>Press <strong>E</strong> for gravity collapse (use sparingly!)</li>
            <li>Tag others by pulling them into your gravity well</li>
            <li>Avoid black holes and use nebulae for cover</li>
            <li>Watch out for comets!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;