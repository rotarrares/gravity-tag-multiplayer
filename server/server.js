const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Game logic
const { 
  GameManager, 
  GAME_CONSTANTS,
  createPlayer
} = require('./game');

// Load environment variables
dotenv.config();

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Set up Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Initialize game manager
const gameManager = new GameManager();

// Set up regular game state updates
setInterval(() => {
  gameManager.update();
  
  // Broadcast game state to all clients
  Object.entries(gameManager.rooms).forEach(([roomId, room]) => {
    io.to(roomId).emit('gameState', {
      players: room.players,
      hazards: room.hazards,
      timeRemaining: room.timeRemaining
    });
  });
}, GAME_CONSTANTS.TICK_RATE);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Player joins game
  socket.on('joinGame', ({ username, roomId }) => {
    let targetRoomId = roomId;
    
    // Create new room if none specified
    if (!targetRoomId) {
      targetRoomId = uuidv4();
      gameManager.createRoom(targetRoomId);
    } else if (!gameManager.rooms[targetRoomId]) {
      // Create room if it doesn't exist
      gameManager.createRoom(targetRoomId);
    }
    
    // Create player
    const player = createPlayer(socket.id, username);
    
    // Add player to room
    gameManager.addPlayerToRoom(targetRoomId, player);
    
    // Join socket room
    socket.join(targetRoomId);
    
    // Send room info to player
    socket.emit('roomJoined', { 
      roomId: targetRoomId,
      playerId: socket.id,
      gameConstants: GAME_CONSTANTS
    });
    
    // Notify room of new player
    io.to(targetRoomId).emit('playerJoined', { 
      id: socket.id, 
      username: username 
    });
  });
  
  // Player movement
  socket.on('playerMove', (moveData) => {
    const { roomId, direction } = moveData;
    if (gameManager.rooms[roomId]) {
      gameManager.updatePlayerMovement(roomId, socket.id, direction);
    }
  });
  
  // Player gravity pulse
  socket.on('gravityPulse', ({ roomId }) => {
    if (gameManager.rooms[roomId]) {
      gameManager.triggerPlayerPulse(roomId, socket.id);
      io.to(roomId).emit('pulseTriggered', { playerId: socket.id });
    }
  });
  
  // Player collapse (special move)
  socket.on('gravityCollapse', ({ roomId }) => {
    if (gameManager.rooms[roomId]) {
      const success = gameManager.triggerPlayerCollapse(roomId, socket.id);
      if (success) {
        io.to(roomId).emit('collapseTriggered', { playerId: socket.id });
      }
    }
  });
  
  // Player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove player from all rooms they were in
    Object.keys(gameManager.rooms).forEach(roomId => {
      if (gameManager.rooms[roomId].players[socket.id]) {
        gameManager.removePlayerFromRoom(roomId, socket.id);
        
        // Notify room of player leaving
        io.to(roomId).emit('playerLeft', { id: socket.id });
        
        // Clean up empty rooms
        if (Object.keys(gameManager.rooms[roomId].players).length === 0) {
          delete gameManager.rooms[roomId];
        }
      }
    });
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});