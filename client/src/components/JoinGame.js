import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './JoinGame.css';

const JoinGame = ({ onJoinGame }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Handle successful room join
    const handleRoomJoined = (data) => {
      console.log('Room joined successfully:', data);
      setIsLoading(false);
      onJoinGame(username, data.roomId, data.playerId);
    };

    // Error handling
    const handleError = (error) => {
      console.error('Server error:', error);
      setError(`Server error: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    };

    // Handle available rooms
    const handleAvailableRooms = (rooms) => {
      console.log('Available rooms:', rooms);
      setAvailableRooms(rooms);
      setIsRefreshingRooms(false);
    };

    socket.on('roomJoined', handleRoomJoined);
    socket.on('error', handleError);
    socket.on('availableRooms', handleAvailableRooms);

    // Get available rooms on component mount
    refreshRooms();

    return () => {
      socket.off('roomJoined', handleRoomJoined);
      socket.off('error', handleError);
      socket.off('availableRooms', handleAvailableRooms);
    };
  }, [socket, username, onJoinGame]);

  // Set a timeout for joining game
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setError('Connection timeout. Please try again.');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Function to refresh rooms list
  const refreshRooms = () => {
    if (!socket || !isConnected || isRefreshingRooms) return;
    
    setIsRefreshingRooms(true);
    socket.emit('getAvailableRooms');
  };

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
      setError('Not connected to server. Please try again or refresh the page.');
      return;
    }

    // Clear any previous errors and set loading state
    setError('');
    setIsLoading(true);
    
    console.log('Attempting to join/create game with:', {
      username: username.trim(),
      roomId: isCreatingGame ? null : roomId.trim()
    });

    // Join or create game
    socket.emit('joinGame', {
      username: username.trim(),
      roomId: isCreatingGame ? null : roomId.trim()
    });
  };

  // Function to copy room code to clipboard
  const copyRoomCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setShowCopySuccess(true);
        // Auto-fill the room code input when in join mode
        if (!isCreatingGame) {
          setRoomId(code);
        }
        setTimeout(() => setShowCopySuccess(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  // Handle click on a room
  const handleRoomClick = (code) => {
    copyRoomCode(code);
    
    if (isCreatingGame) {
      // If in create mode, switch to join mode
      setIsCreatingGame(false);
    }
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

        {!isCreatingGame && (
          <div className="available-rooms">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3>Available Rooms</h3>
              <button 
                className="refresh-button" 
                onClick={refreshRooms}
                disabled={!isConnected || isRefreshingRooms}
              >
                {isRefreshingRooms ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="room-list">
              {availableRooms.length > 0 ? (
                availableRooms.map((room) => (
                  <div 
                    key={room.roomId} 
                    className="room-item"
                    onClick={() => handleRoomClick(room.roomId)}
                  >
                    <span className="room-code">{room.roomId}</span>
                    <span className="player-count">
                      {room.playerCount} {room.playerCount === 1 ? 'player' : 'players'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-list">
                  No active games found. Try refreshing or create a new game!
                </div>
              )}
            </div>
          </div>
        )}

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
              disabled={isLoading}
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
                placeholder="Enter 4-character room code"
                maxLength={4}
                disabled={isLoading}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={!isConnected || isLoading}
          >
            {isLoading 
              ? 'Connecting...' 
              : isCreatingGame 
                ? 'Create Game' 
                : 'Join Game'
            }
          </button>

          {!isConnected && (
            <div className="connection-status">
              Connecting to server... If this persists, try refreshing the page.
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

      {showCopySuccess && (
        <div className="copy-success">
          Room code copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default JoinGame;