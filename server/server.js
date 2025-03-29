const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

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

// Better socket.io configuration for production with compression
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
  maxHttpBufferSize: 1e8,
  // Enable socket.io compression
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: {
      chunkSize: 16 * 1024,
      memLevel: 7,
      level: 3
    }
  }
});

// Initialize game manager
const gameManager = new GameManager(io);

// Function to generate a 4-character room code
function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Add event emitter for tagging events
gameManager.setEventEmitter((roomId, eventName, data) => {
  // Set up special event handlers
  switch (eventName) {
    case 'playerTagged':
      console.log(`Player tagged in room ${roomId}: ${data.taggedId} ${data.reason ? '(' + data.reason + ')' : ''}`);
      io.to(roomId).emit(eventName, data);
      break;
    case 'playerUntagged':
      console.log(`Player untagged in room ${roomId}: ${data.playerId} ${data.reason ? '(' + data.reason + ')' : ''}`);
      io.to(roomId).emit(eventName, data);
      break;
    default:
      // Default event handling
      io.to(roomId).emit(eventName, data);
  }
});

// Set up regular game state updates
setInterval(() => {
  gameManager.update();
  
  // Broadcast game state to all clients using delta compression
  Object.entries(gameManager.rooms).forEach(([roomId, room]) => {
    try {
      // Send delta state updates
      const deltaState = gameManager.generateDeltaState(roomId);
      
      // Only emit if there are actual changes to send
      if (Object.keys(deltaState.players).length > 0 || deltaState.hazards.length > 0) {
        io.to(roomId).emit('gameState', deltaState);
      }
      
      // Always send time remaining as it's always changing
      io.to(roomId).emit('timeUpdate', {
        timeRemaining: room.timeRemaining
      });
    } catch (error) {
      console.error(`Error broadcasting to room ${roomId}:`, error);
    }
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
      // Generate a 4-character room code
      do {
        targetRoomId = generateRoomCode();
      } while (gameManager.rooms[targetRoomId]); // Ensure it's unique
      
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
      
      // Store room ID on the socket for quick reference
      socket.roomId = targetRoomId;
      
      // Send room info to player
      socket.emit('roomJoined', { 
        roomId: targetRoomId,
        playerId: socket.id,
        gameConstants: GAME_CONSTANTS
      });
      
      // Send initial full game state to the joining player
      const fullState = gameManager.generateFullState(targetRoomId);
      socket.emit('gameState', fullState);
      
      // Notify room of new player
      io.to(targetRoomId).emit('playerJoined', { 
        id: socket.id, 
        username: username 
      });
      
      // Randomly tag a player at the start if nobody is tagged yet
      const room = gameManager.rooms[targetRoomId];
      const players = Object.values(room.players);
      
      // If there's at least 2 players and nobody is tagged, randomly tag someone
      const anyoneTagged = players.some(p => p.isTagged);
      if (players.length >= 2 && !anyoneTagged) {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        randomPlayer.isTagged = true;
        randomPlayer.lastTaggedTime = Date.now();
        
        console.log(`Randomly tagged player ${randomPlayer.username || randomPlayer.id} to start the game`);
        
        // Notify room of initial tag
        io.to(targetRoomId).emit('playerTagged', {
          taggedId: randomPlayer.id,
          reason: 'game_start',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`Error joining game: ${error.message}`);
      socket.emit('error', { message: 'Failed to join game. Please try again.' });
    }
  });
  
  // Get available rooms
  socket.on('getAvailableRooms', () => {
    const availableRooms = Object.entries(gameManager.rooms).map(([roomId, room]) => ({
      roomId,
      playerCount: Object.keys(room.players).length
    }));
    
    socket.emit('availableRooms', availableRooms);
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
      
      // Send current game state
      const fullState = gameManager.generateFullState(roomId);
      socket.emit('gameState', fullState);
    } else {
      console.log('Room not found, sending only game constants');
      socket.emit('gameConstants', GAME_CONSTANTS);
    }
  });
  
  // Player client performance settings
  socket.on('setPerformanceMode', ({ mode }) => {
    const roomId = socket.roomId;
    if (!roomId || !gameManager.rooms[roomId]) return;
    
    // Store performance mode preference on the socket
    socket.performanceMode = mode;
    console.log(`Player ${socket.id} set performance mode to: ${mode}`);
    
    // Respond with confirmation
    socket.emit('performanceModeSet', { mode });
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
      const success = gameManager.triggerPlayerPulse(roomId, socket.id);
      if (success) {
        // Get updated player data
        const player = gameManager.rooms[roomId].players[socket.id];
        
        // Emit pulse event with timing information
        io.to(roomId).emit('pulseTriggered', { 
          playerId: socket.id,
          timestamp: Date.now(),
          pulseStartTime: player.pulseStartTime,
          lastPulseTime: player.lastPulseTime
        });
      }
    }
  });
  
  // Player collapse (special move)
  socket.on('gravityCollapse', ({ roomId }) => {
    console.log(`Player ${socket.id} triggered collapse in room ${roomId}`);
    if (gameManager.rooms[roomId]) {
      const success = gameManager.triggerPlayerCollapse(roomId, socket.id);
      console.log(`Collapse success: ${success}`);
      if (success) {
        // Get updated player data
        const player = gameManager.rooms[roomId].players[socket.id];
        
        // Emit collapse event with timing information
        io.to(roomId).emit('collapseTriggered', { 
          playerId: socket.id,
          timestamp: Date.now(),
          collapseStartTime: player.collapseStartTime,
          lastCollapseTime: player.lastCollapseTime
        });
        
        // Force an immediate game state update to ensure everybody sees the collapse
        const fullState = gameManager.generateFullState(roomId);
        io.to(roomId).emit('gameState', fullState);
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
          delete gameManager.roomStates[roomId];
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
