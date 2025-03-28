# Gravity Tag

A real-time multiplayer game where players use gravity wells to outmaneuver opponents in a cosmic game of tag.

## Game Concept

In Gravity Tag, players are "orbiters" in a 2D arena, using personal gravity wells to tag or evade others:

- Movement bends space; standing still amplifies your pull
- Tag others to score points, avoid being tagged
- Try to be the last untagged player
- Watch out for cosmic hazards like black holes, nebulae, and comets

## Features

- Real-time multiplayer using Socket.IO
- Dynamic arena with physics-based movement
- Special abilities: Gravity Pulse and Gravity Collapse
- Environmental hazards that affect gameplay
- Energy management system
- Multiple game modes: Free-for-All, Team Orbit, King of the Void
- Cosmic-themed visuals with particle effects

## Technologies Used

- Node.js/Express for the backend
- React for the frontend
- Socket.IO for real-time communication
- HTML5 Canvas for rendering

## Installation and Setup

### Prerequisites

- Node.js (version 18.x or later)
- npm or yarn package manager

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gravity-tag.git
   cd gravity-tag
   ```

2. Install dependencies:
   ```
   npm install
   cd client
   npm install
   cd ..
   ```

3. Start the development server:
   ```
   npm run dev
   ```

This will start both the server (on port 5000) and the client (on port 3000) concurrently.

## Deployment to Heroku

### Using Heroku CLI

1. Create a Heroku app:
   ```
   heroku create your-app-name
   ```

2. Deploy to Heroku:
   ```
   git push heroku main
   ```

### Using GitHub Integration

1. Create a new app on Heroku
2. Connect your GitHub repository
3. Enable automatic deploys from your main branch

## Game Controls

- WASD or Arrow Keys - Move your orbiter
- Space - Activate Gravity Pulse
- E - Trigger Gravity Collapse (use sparingly)
- Stay still to increase your gravity pull

## Game Mechanics

- **Gravity Wells**: Each player has a gravity well that pulls other players
- **Tagging**: Enter another player's gravity well to tag them
- **Energy**: Resource for special abilities, regenerates over time
- **Hazards**:
  - Black Holes: Strong gravity wells that pull players in
  - Nebulae: Areas where gravity effects are weakened
  - Comets: Fast-moving obstacles that can knock players off course

## License

This project is licensed under the MIT License - see the LICENSE file for details.