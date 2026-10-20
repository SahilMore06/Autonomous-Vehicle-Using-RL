const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/', perMessageDeflate: false });

// Middleware
app.use(cors());
app.use(express.json());

// Resolve project directories dynamically
const potentialStateFiles = [
  path.join(__dirname, '../autonomus/autonomous-rl-vehicle/simulator/state.json'),
  path.join(__dirname, '../simulator/state.json'),
  path.join(__dirname, 'state.json')
];

const potentialCollisionFiles = [
  path.join(__dirname, '../autonomus/autonomous-rl-vehicle/simulator/collision_areas.txt'),
  path.join(__dirname, '../simulator/collision_areas.txt'),
  path.join(__dirname, 'collision_areas.txt')
];

const potentialAssetDirs = [
  path.join(__dirname, '../autonomus/autonomous-rl-vehicle/simulator/assets'),
  path.join(__dirname, '../simulator/assets'),
  path.join(__dirname, 'client/public/simulator-assets')
];

function getExistingPath(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return paths[0];
}

const STATE_FILE = getExistingPath(potentialStateFiles);
const COLLISION_FILE = getExistingPath(potentialCollisionFiles);
const ASSET_DIR = getExistingPath(potentialAssetDirs);

// Serve static simulator assets
app.use('/simulator-assets', express.static(ASSET_DIR));
app.use(express.static(path.join(__dirname, 'client/build')));

// Store for historical data
let rewardHistory = [];
let episodeHistory = [];
let currentState = null;
let lastStateMtime = 0;
let connectedClients = new Set();

// Read collision areas
function readCollisionAreas() {
  try {
    if (fs.existsSync(COLLISION_FILE)) {
      const raw = fs.readFileSync(COLLISION_FILE, 'utf8');
      const lines = raw.trim().split('\n');
      return lines.map(line => {
        const parts = line.trim().split(/\s+/).map(Number);
        if (parts.length === 4) {
          return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
        }
        return null;
      }).filter(Boolean);
    }
  } catch (err) {
    console.error('Error reading collision areas:', err.message);
  }
  return [];
}

const cachedCollisionAreas = readCollisionAreas();

// Read state file
function readStateFile() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const stats = fs.statSync(STATE_FILE);
      lastStateMtime = stats.mtimeMs;
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // File may be midway through atomic write
  }
  return null;
}

// Broadcast state to all connected clients
function broadcastState(state, isLive = true) {
  const message = JSON.stringify({
    type: 'state_update',
    data: state,
    isLive,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  connectedClients.add(ws);

  // Send initial handshake with state, history, and track obstacles
  ws.send(JSON.stringify({
    type: 'init',
    projectName: 'Autonomous Vehicle Using RL',
    data: currentState,
    collisionAreas: cachedCollisionAreas,
    rewardHistory: rewardHistory.slice(-500),
    episodeHistory: episodeHistory.slice(-500),
    simulatorRunning: (Date.now() - lastStateMtime) < 4000
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'request_history') {
        ws.send(JSON.stringify({
          type: 'history',
          rewardHistory: rewardHistory.slice(-500),
          episodeHistory: episodeHistory.slice(-500)
        }));
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Rapid polling for smooth 10Hz telemetry updates
setInterval(() => {
  const state = readStateFile();
  if (state) {
    // Check if this is a new episode
    if (currentState && state.episode !== currentState.episode) {
      rewardHistory.push({
        episode: currentState.episode,
        reward: currentState.total_reward,
        avgReward: currentState.avg_reward,
        epsilon: currentState.epsilon
      });

      if (rewardHistory.length > 1000) {
        rewardHistory = rewardHistory.slice(-1000);
      }
    }

    // Store episode step data
    if (!currentState || state.step !== currentState.step || state.episode !== currentState.episode) {
      episodeHistory.push({
        episode: state.episode,
        step: state.step,
        reward: state.total_reward,
        position: state.position,
        sensors: state.sensors,
        collisions: state.collisions,
        action: state.last_action
      });

      if (episodeHistory.length > 500) {
        episodeHistory = episodeHistory.slice(-500);
      }
    }

    currentState = state;
    const isRecentlyActive = (Date.now() - lastStateMtime) < 4000;
    broadcastState(state, isRecentlyActive);
  }
}, 100);

// REST API endpoints
app.get('/api/config', (req, res) => {
  res.json({
    projectName: 'Autonomous Vehicle Using RL',
    version: '2.0.0',
    algorithm: 'Q-Learning (Off-Policy TD Control)',
    stateDiscretization: {
      buckets: 4,
      variables: 5,
      totalStates: 1024
    },
    actionSpace: [
      { id: 0, name: 'DO_NOTHING', desc: 'Maintain current velocity & heading' },
      { id: 1, name: 'ACCELERATE', desc: 'Increase forward velocity (+0.2)' },
      { id: 2, name: 'BRAKE', desc: 'Decelerate forward velocity (-0.3)' },
      { id: 3, name: 'TURN_LEFT', desc: 'Steer counter-clockwise (-15 deg)' },
      { id: 4, name: 'TURN_RIGHT', desc: 'Steer clockwise (+15 deg)' }
    ]
  });
});

app.get('/api/collision-areas', (req, res) => {
  res.json(cachedCollisionAreas);
});

app.get('/api/state', (req, res) => {
  const state = readStateFile();
  const isRecentlyActive = (Date.now() - lastStateMtime) < 4000;
  res.json({
    state: state || {},
    simulatorRunning: isRecentlyActive,
    rewardHistory: rewardHistory.slice(-200),
    episodeHistory: episodeHistory.slice(-200),
    clientCount: connectedClients.size
  });
});

app.get('/api/history', (req, res) => {
  res.json({
    rewards: rewardHistory.slice(-500),
    episodes: episodeHistory.slice(-500)
  });
});

app.get('/api/status', (req, res) => {
  const isRecentlyActive = (Date.now() - lastStateMtime) < 4000;
  res.json({
    projectName: 'Autonomous Vehicle Using RL',
    simulatorRunning: isRecentlyActive,
    connectedClients: connectedClients.size,
    lastUpdate: new Date(lastStateMtime || Date.now()).toISOString(),
    currentEpisode: currentState?.episode || 0,
    epsilon: currentState?.epsilon || 0.05
  });
});

// Fallback to React client SPA
app.get('*', (req, res) => {
  const indexHtml = path.join(__dirname, 'client/build/index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Dashboard client build not found. Please build the client first.');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚗 Autonomous Vehicle Using RL - Telemetry Server`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Stream: ws://localhost:${PORT}`);
  console.log(`📁 Reading Telemetry from: ${path.resolve(STATE_FILE)}`);
  console.log(`====================================================`);
});
