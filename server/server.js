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

// Better socket.io configuration for production
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
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
    console.log(`Player ${username} (${socket.id}) attempting to join room: ${roomId || 'new room'}`);
    
    let targetRoomId = roomId;
    
    // Create new room if none specified
    if (!targetRoomId) {
      targetRoomId = uuidv4();
      gameManager.createRoom(targetRoomId);
      console.log(`Created new room: ${targetRoomId}`);
    } else if (!gameManager.rooms[targetRoomId]) {
      // Create room if it doesn't exist
      gameManager.createRoom(targetRoomId);
      console.log(`Created room from ID: ${targetRoomId}`);
    }
    
    try {
      // Create player
      const player = createPlayer(socket.id, username);
      
      // Add player to room
      gameManager.addPlayerToRoom(targetRoomId, player);
      
      // Join socket room
      socket.join(targetRoomId);
      
      console.log(`Player ${username} (${socket.id}) joined room: ${targetRoomId}`);
      
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
    } catch (error) {
      console.error(`Error joining game: ${error.message}`);
      socket.emit('error', { message: 'Failed to join game. Please try again.' });
    }
  });
  
  // Handle direct request for game constants
  socket.on('requestGameConstants', ({ roomId }) => {
    console.log(`Player ${socket.id} requesting game constants for room: ${roomId}`);
    
    if (roomId && gameManager.rooms[roomId]) {
      console.log('Sending game constants directly');
      socket.emit('gameConstants', GAME_CONSTANTS);
      
      // Re-send the roomJoined event as a backup
      socket.emit('roomJoined', { 
        roomId: roomId,
        playerId: socket.id,
        gameConstants: GAME_CONSTANTS
      });
    } else {
      console.log('Room not found, sending only game constants');
      socket.emit('gameConstants', GAME_CONSTANTS);
    }
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
      if (gameManager.rooms[roomId]?.players?.[socket.id]) {
        gameManager.removePlayerFromRoom(roomId, socket.id);
        
        // Notify room of player leaving
        io.to(roomId).emit('playerLeft', { id: socket.id });
        
        // Clean up empty rooms
        if (Object.keys(gameManager.rooms[roomId].players).length === 0) {
          delete gameManager.rooms[roomId];
          console.log(`Deleted empty room: ${roomId}`);
        }
      }
    });
  });
  
  // General error handler
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  console.log(`Serving static files from: ${clientBuildPath}`);
  
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).send('Something broke on the server!');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});