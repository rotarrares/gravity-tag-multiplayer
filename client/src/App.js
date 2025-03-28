import React, { useState } from 'react';
import './App.css';
import JoinGame from './components/JoinGame';
import Game from './components/Game';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  const [gameState, setGameState] = useState({
    isInGame: false,
    username: '',
    roomId: null,
    playerId: null
  });

  const handleJoinGame = (username, roomId, playerId) => {
    setGameState({
      isInGame: true,
      username,
      roomId,
      playerId
    });
  };

  const handleExitGame = () => {
    setGameState({
      isInGame: false,
      username: '',
      roomId: null,
      playerId: null
    });
  };

  return (
    <div className="App">
      <div className="cosmic-background"></div>
      <SocketProvider>
        {!gameState.isInGame ? (
          <JoinGame onJoinGame={handleJoinGame} />
        ) : (
          <Game 
            username={gameState.username}
            roomId={gameState.roomId}
            playerId={gameState.playerId}
            onExitGame={handleExitGame}
          />
        )}
      </SocketProvider>
    </div>
  );
}

export default App;