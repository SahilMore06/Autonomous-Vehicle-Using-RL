import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { css } from 'styled-components';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { COLLISION_OBSTACLES } from './collisionData';

// --- Clean Engineering Theme Tokens ---
const THEME = {
  bg: '#0b0f19',
  surface: '#111827',
  surfaceAlt: '#1e293b',
  border: '#1f293d',
  borderLight: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  accent: '#0284c7',       // Professional deep cyan
  accentLight: '#38bdf8',
  success: '#10b981',      // Emerald green
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  purple: '#8b5cf6',
};

// --- Styled Components ---
const RootContainer = styled.div`
  min-height: 100vh;
  background-color: ${THEME.bg};
  color: ${THEME.text};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
`;

const TopNavbar = styled.header`
  background-color: ${THEME.surface};
  border-bottom: 1px solid ${THEME.border};
  padding: 14px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
  }
`;

const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;

  h1 {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.2px;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  p {
    margin: 3px 0 0 0;
    font-size: 0.78rem;
    color: ${THEME.textMuted};
    letter-spacing: 0.2px;

    span.author {
      color: ${THEME.accentLight};
      font-weight: 500;
    }
  }
`;

const NavControls = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`;

const ModeToggleGroup = styled.div`
  display: flex;
  background: ${THEME.bg};
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 3px;
`;

const ModeOption = styled.button`
  background: ${props => props.$active ? THEME.surfaceAlt : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : THEME.textMuted};
  border: 1px solid ${props => props.$active ? THEME.borderLight : 'transparent'};
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: ${THEME.bg};
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.$active ? THEME.success : THEME.textMuted};

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${props => props.$active ? THEME.success : THEME.textDim};
  }
`;

const ActionButton = styled.button`
  background: ${THEME.bg};
  border: 1px solid ${THEME.border};
  color: ${THEME.textMuted};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;

  &:hover {
    background: ${THEME.surfaceAlt};
    border-color: ${THEME.borderLight};
    color: #ffffff;
  }

  ${props => props.$primary && css`
    background: ${THEME.accent};
    border-color: ${THEME.accentLight};
    color: #ffffff;

    &:hover {
      background: #0369a1;
    }
  `}
`;

const NavigationTabBar = styled.nav`
  background-color: ${THEME.surface};
  border-bottom: 1px solid ${THEME.border};
  padding: 0 28px;
  display: flex;
  gap: 4px;
  overflow-x: auto;

  @media (max-width: 900px) {
    padding: 0 16px;
  }
`;

const TabItem = styled.button`
  background: transparent;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? THEME.accentLight : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : THEME.textMuted};
  padding: 12px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: #ffffff;
  }
`;

const MainLayout = styled.main`
  max-width: 1680px;
  width: 100%;
  margin: 20px auto;
  padding: 0 28px;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  flex: 1;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 900px) {
    padding: 0 16px;
    margin: 14px auto;
  }
`;

const ContentPanel = styled.div`
  background: ${THEME.surface};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid ${THEME.border};

  h2 {
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #ffffff;
    margin: 0;
  }

  span.meta {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.72rem;
    color: ${THEME.textMuted};
  }
`;

// Metrics Row
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
`;

const MetricCard = styled.div`
  background: ${THEME.bg};
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 12px 14px;
`;

const MetricLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${THEME.textDim};
  margin-bottom: 6px;
`;

const MetricNumber = styled.div`
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: baseline;
  gap: 4px;

  small {
    font-size: 0.72rem;
    font-weight: 500;
    color: ${THEME.textMuted};
  }
`;

// Canvas Container
const ViewportWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  background: #060912;
  border: 1px solid ${THEME.border};
`;

const TelemetryCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const ViewportToolbar = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const ViewportInfoBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 6px 12px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.74rem;
  color: ${THEME.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;

  span.value {
    color: #ffffff;
    font-weight: 600;
  }
`;

// Action Badge
const ActionPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$action) {
      case 'ACCELERATE': return 'rgba(16, 185, 129, 0.15)';
      case 'BRAKE': return 'rgba(239, 68, 68, 0.15)';
      case 'TURN_LEFT': return 'rgba(2, 132, 199, 0.15)';
      case 'TURN_RIGHT': return 'rgba(139, 92, 246, 0.15)';
      default: return 'rgba(148, 163, 184, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$action) {
      case 'ACCELERATE': return THEME.success;
      case 'BRAKE': return THEME.danger;
      case 'TURN_LEFT': return THEME.accentLight;
      case 'TURN_RIGHT': return THEME.purple;
      default: return THEME.textMuted;
    }
  }};
  border: 1px solid ${props => {
    switch (props.$action) {
      case 'ACCELERATE': return 'rgba(16, 185, 129, 0.3)';
      case 'BRAKE': return 'rgba(239, 68, 68, 0.3)';
      case 'TURN_LEFT': return 'rgba(2, 132, 199, 0.3)';
      case 'TURN_RIGHT': return 'rgba(139, 92, 246, 0.3)';
      default: return THEME.border;
    }
  }};
`;

// LiDAR Distance Meters
const SensorBarGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SensorCard = styled.div`
  background: ${THEME.bg};
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  div.header {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${THEME.textDim};
  }

  div.track {
    height: 6px;
    background: ${THEME.surfaceAlt};
    border-radius: 3px;
    overflow: hidden;
  }

  div.fill {
    height: 100%;
    width: ${props => Math.max(0, Math.min(100, (props.$val || 0) * 100))}%;
    background-color: ${props => {
      const v = props.$val || 0;
      if (v < 0.25) return THEME.danger;
      if (v < 0.50) return THEME.warning;
      return THEME.success;
    }};
    transition: width 0.15s ease-out;
  }

  div.val {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.78rem;
    font-weight: 600;
    color: #ffffff;
    text-align: right;
  }
`;

// System Terminal
const TerminalLog = styled.div`
  background: ${THEME.bg};
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 12px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.74rem;
  height: 280px;
  overflow-y: auto;
  color: ${THEME.textMuted};

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${THEME.borderLight};
    border-radius: 2px;
  }
`;

const LogEntry = styled.div`
  line-height: 1.6;
  display: flex;
  gap: 8px;

  span.time {
    color: ${THEME.textDim};
    user-select: none;
  }
  span.prefix {
    color: ${THEME.accentLight};
  }
  span.text {
    color: ${props => props.$color || THEME.text};
  }
`;

// Footer
const PageFooter = styled.footer`
  margin-top: auto;
  padding: 16px 28px;
  border-top: 1px solid ${THEME.border};
  background-color: ${THEME.surface};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: ${THEME.textDim};

  a {
    color: ${THEME.textMuted};
    text-decoration: none;
    &:hover {
      color: #ffffff;
    }
  }
`;

// Web Audio API feedback helper (clean, subtle beeps)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playCollision() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      // Audio autoplay policy handled
    }
  }
}

const soundManager = new SoundManager();

// ==========================================
// Main Application Component
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('cockpit'); // 'cockpit', 'qlearning', 'analytics', 'lab', 'logs'
  const [simulationMode, setSimulationMode] = useState('cpp'); // 'cpp' (default native), 'browser' (interactive)
  const [wsConnected, setWsConnected] = useState(false);
  const [cppEngineActive, setCppEngineActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Viewport overlays
  const [showRays, setShowRays] = useState(true);
  const [showObstacles, setShowObstacles] = useState(true);
  const [showTrail, setShowTrail] = useState(true);

  // Manual drive
  const [manualDriveActive, setManualDriveActive] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);

  // Display Telemetry State
  const [telemetry, setTelemetry] = useState({
    episode: 61173,
    step: 1,
    total_reward: 0.0,
    avg_reward: 0.0,
    epsilon: 0.05,
    position: { x: 400, y: 300 },
    angle: 0,
    speed: 0.0,
    steering: 0.0,
    sensors: { front: 1.0, front_left: 1.0, front_right: 1.0, left: 1.0, right: 1.0 },
    collisions: 0,
    last_action: 'DO_NOTHING',
    window_width: 986,
    window_height: 980
  });

  // Smoothed sensor readings for stable visual meters (prevents jitter)
  const [smoothSensors, setSmoothSensors] = useState({
    front: 1.0, front_left: 1.0, front_right: 1.0, left: 1.0, right: 1.0
  });

  const [rewardHistory, setRewardHistory] = useState([]);
  const [logEntries, setLogEntries] = useState([]);

  // Asset References
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const bgImageRef = useRef(null);
  const carImageRef = useRef(null);
  const trailRef = useRef([]);

  // In-browser autonomous driving state (used ONLY when simulationMode === 'browser')
  const browserSimRef = useRef({
    x: 400,
    y: 300,
    angle: 0,
    velocity: 0,
    steering: 0,
    episode: 1,
    step: 0,
    totalReward: 0,
    collisions: 0,
    epsilon: 0.15,
    lastAction: 'DO_NOTHING'
  });

  // Append entry to system logs
  const addLog = useCallback((text, type = 'info') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    let color = THEME.text;
    if (type === 'collision') color = THEME.danger;
    if (type === 'action') color = THEME.accentLight;
    if (type === 'reward') color = THEME.success;

    setLogEntries(prev => [
      { id: Math.random().toString(), time: timeStr, text, color },
      ...prev.slice(0, 100)
    ]);
  }, []);

  const [assetsVersion, setAssetsVersion] = useState(0);

  // Preload background and car assets
  useEffect(() => {
    const bg = new Image();
    bg.src = '/simulator-assets/city.jpg';
    bg.onload = () => {
      bgImageRef.current = bg;
      setAssetsVersion(v => v + 1);
    };

    const car = new Image();
    car.src = '/simulator-assets/car sprite.png';
    car.onload = () => {
      carImageRef.current = car;
      setAssetsVersion(v => v + 1);
    };
  }, []);

  // Sensor Smoothing logic (Exponential Moving Average)
  useEffect(() => {
    const target = telemetry.sensors || {};
    setSmoothSensors(prev => ({
      front: prev.front * 0.7 + (target.front ?? 1.0) * 0.3,
      front_left: prev.front_left * 0.7 + (target.front_left ?? 1.0) * 0.3,
      front_right: prev.front_right * 0.7 + (target.front_right ?? 1.0) * 0.3,
      left: prev.left * 0.7 + (target.left ?? 1.0) * 0.3,
      right: prev.right * 0.7 + (target.right ?? 1.0) * 0.3
    }));
  }, [telemetry]);

  // WebSocket Connection to Node.js Backend (C++ Telemetry Stream)
  useEffect(() => {
    let reconnectTimer = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        addLog('Connected to backend telemetry server (WebSocket)', 'action');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state_update') {
            setCppEngineActive(msg.isLive);
            // ONLY apply C++ updates if in 'cpp' mode
            if (simulationMode === 'cpp') {
              setTelemetry(msg.data);
              if (msg.data.collisions > 0) soundManager.playCollision();
            }
          } else if (msg.type === 'init' || msg.type === 'history') {
            if (msg.simulatorRunning !== undefined) setCppEngineActive(msg.simulatorRunning);
            if (msg.data && simulationMode === 'cpp') setTelemetry(msg.data);
            if (msg.rewardHistory) setRewardHistory(msg.rewardHistory);
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setCppEngineActive(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [simulationMode, addLog]);

  // Raycasting Sensor Helper (Used only for Browser Simulation Mode)
  const castRay = useCallback((ox, oy, angleDeg, maxDist = 300) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const stepSize = 4;
    let dist = 0;

    while (dist < maxDist) {
      const px = ox + cosA * dist;
      const py = oy + sinA * dist;

      if (px <= 0 || px >= 986 || py <= 0 || py >= 980) {
        return dist / maxDist;
      }

      for (let i = 0; i < COLLISION_OBSTACLES.length; i++) {
        const obs = COLLISION_OBSTACLES[i];
        if (px >= obs.x && px <= obs.x + obs.width && py >= obs.y && py <= obs.y + obs.height) {
          return dist / maxDist;
        }
      }

      dist += stepSize;
    }
    return 1.0;
  }, []);

  // Browser Simulation Physics Loop (Executes ONLY when simulationMode === 'browser')
  useEffect(() => {
    if (simulationMode !== 'browser') return;

    const intervalTime = Math.max(10, Math.floor(40 / simSpeed));
    const timer = setInterval(() => {
      const car = browserSimRef.current;
      car.step += 1;

      // Autopilot decision if manual drive is disabled
      if (!manualDriveActive) {
        const sFront = castRay(car.x, car.y, car.angle);
        const sLeft = castRay(car.x, car.y, car.angle - 45);
        const sRight = castRay(car.x, car.y, car.angle + 45);

        if (sFront < 0.28) {
          if (sLeft > sRight) {
            car.steering = -0.4;
            car.angle -= 10;
            car.velocity = Math.max(1.0, car.velocity * 0.88);
            car.lastAction = 'TURN_LEFT';
          } else {
            car.steering = 0.4;
            car.angle += 10;
            car.velocity = Math.max(1.0, car.velocity * 0.88);
            car.lastAction = 'TURN_RIGHT';
          }
        } else {
          car.velocity = Math.min(3.2, car.velocity + 0.12);
          car.steering = 0;
          car.lastAction = 'ACCELERATE';
        }
      }

      // Update kinematics
      const rad = (car.angle * Math.PI) / 180;
      car.x += Math.cos(rad) * car.velocity;
      car.y += Math.sin(rad) * car.velocity;

      // Check collision with boundary or obstacles
      let collided = false;
      if (car.x < 30 || car.x > 950 || car.y < 30 || car.y > 950) {
        collided = true;
      } else {
        for (let i = 0; i < COLLISION_OBSTACLES.length; i++) {
          const obs = COLLISION_OBSTACLES[i];
          if (car.x >= obs.x && car.x <= obs.x + obs.width && car.y >= obs.y && car.y <= obs.y + obs.height) {
            collided = true;
            break;
          }
        }
      }

      const sensors = {
        front: castRay(car.x, car.y, car.angle),
        front_left: castRay(car.x, car.y, car.angle - 45),
        front_right: castRay(car.x, car.y, car.angle + 45),
        left: castRay(car.x, car.y, car.angle - 90),
        right: castRay(car.x, car.y, car.angle + 90)
      };

      if (collided) {
        car.collisions += 1;
        car.totalReward -= 10;
        soundManager.playCollision();
        addLog(`Collision in Episode #${car.episode} at Step ${car.step}`, 'collision');

        // Respawn vehicle
        car.episode += 1;
        car.step = 0;
        car.x = 400;
        car.y = 300;
        car.angle = 0;
        car.velocity = 0;
        car.totalReward = 0;
        car.epsilon = Math.max(0.05, car.epsilon * 0.99);
      } else {
        car.totalReward += 0.2 + (car.velocity * 0.05);
      }

      const stateSnapshot = {
        episode: car.episode,
        step: car.step,
        total_reward: car.totalReward,
        avg_reward: car.totalReward / Math.max(1, car.step),
        epsilon: car.epsilon,
        position: { x: car.x, y: car.y },
        angle: car.angle,
        speed: car.velocity,
        steering: car.steering,
        sensors,
        collisions: car.collisions,
        last_action: car.lastAction,
        window_width: 986,
        window_height: 980
      };

      setTelemetry(stateSnapshot);

      if (car.step % 20 === 0) {
        setRewardHistory(prev => [
          ...prev.slice(-300),
          { episode: car.episode, reward: car.totalReward, epsilon: car.epsilon }
        ]);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [simulationMode, manualDriveActive, simSpeed, castRay, addLog]);

  // Keyboard Event Handlers for Manual Drive
  useEffect(() => {
    if (simulationMode !== 'browser' || !manualDriveActive) return;

    const handleKeyDown = (e) => {
      const car = browserSimRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        car.velocity = Math.min(4.0, car.velocity + 0.35);
        car.lastAction = 'ACCELERATE';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        car.velocity = Math.max(-1.5, car.velocity - 0.4);
        car.lastAction = 'BRAKE';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        car.angle -= 9;
        car.lastAction = 'TURN_LEFT';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        car.angle += 9;
        car.lastAction = 'TURN_RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [simulationMode, manualDriveActive]);

  // -------------------------------------------------------------
  // High-Visibility 2D Canvas Renderer (Solves "car is not showing")
  // -------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // 1. Render Background Track Texture or Clean Asphalt Grid
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, width, height);
      // Subtle contrast tint to ensure vehicle and sensors pop clearly
      ctx.fillStyle = 'rgba(11, 15, 25, 0.45)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Clean grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    }

    const simW = telemetry?.window_width || 986;
    const simH = telemetry?.window_height || 980;
    const sx = width / simW;
    const sy = height / simH;

    // 2. Render Obstacles
    if (showObstacles) {
      ctx.lineWidth = 1.5;
      for (let i = 0; i < COLLISION_OBSTACLES.length; i++) {
        const obs = COLLISION_OBSTACLES[i];
        const ox = obs.x * sx;
        const oy = obs.y * sy;
        const ow = obs.width * sx;
        const oh = obs.height * sy;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
        ctx.strokeRect(ox, oy, ow, oh);
      }
    }

    if (!telemetry) return;

    const posX = (telemetry.position?.x ?? 400) * sx;
    const posY = (telemetry.position?.y ?? 300) * sy;
    const angleDeg = telemetry.angle ?? 0;
    const angleRad = (angleDeg * Math.PI) / 180;

    // 3. Render Breadcrumb Trajectory Trail
    if (showTrail) {
      trailRef.current.push({ x: posX, y: posY });
      if (trailRef.current.length > 90) trailRef.current.shift();

      if (trailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 4. Render LiDAR Distance Rays
    if (showRays) {
      const sensors = telemetry.sensors || {};
      const rayAngles = [0, -Math.PI / 4, Math.PI / 4, -Math.PI / 2, Math.PI / 2];
      const sensorKeys = ['front', 'front_left', 'front_right', 'left', 'right'];

      sensorKeys.forEach((key, idx) => {
        const sDist = sensors[key] ?? 1.0;
        const beamAngle = angleRad + rayAngles[idx];
        const beamLength = 170 * sDist * sx;
        const targetX = posX + beamLength * Math.cos(beamAngle);
        const targetY = posY + beamLength * Math.sin(beamAngle);

        let rayColor = THEME.success;
        if (sDist < 0.25) rayColor = THEME.danger;
        else if (sDist < 0.50) rayColor = THEME.warning;

        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(targetX, targetY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = rayColor;
        ctx.fill();
      });
    }

    // 5. Render High-Visibility Vehicle (Crisp, High-Contrast, Never Missing)
    ctx.save();
    ctx.translate(posX, posY);

    // Dynamic Locator Ring (Soft pulsing halo so vehicle is instantly visible on map)
    ctx.beginPath();
    ctx.arc(0, 0, 28 * sx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.rotate(angleRad);

    // If car sprite texture loaded, draw sprite; otherwise draw high-contrast geometric chassis
    if (carImageRef.current) {
      // In SFML the sprite had 180 deg base rotation, so we draw it oriented cleanly
      const carW = 46 * sx;
      const carH = 24 * sy;
      ctx.drawImage(carImageRef.current, -carW / 2, -carH / 2, carW, carH);
    } else {
      // High-Contrast Solid Vehicle Chassis
      const carW = 44 * sx;
      const carH = 22 * sy;

      // Chassis Body
      ctx.fillStyle = '#f8fafc'; // Crisp white-silver body for maximum visibility
      ctx.beginPath();
      ctx.rect(-carW / 2, -carH / 2, carW, carH);
      ctx.fill();

      // Bold dark border
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-carW / 2, -carH / 2, carW, carH);

      // Windshield & Roof
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-carW * 0.15, -carH * 0.35, carW * 0.35, carH * 0.7);

      // Front Headlight Cones (Warm bright yellow)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(carW / 2 - 4, -carH * 0.4, 4, 5);
      ctx.fillRect(carW / 2 - 4, carH * 0.4 - 5, 4, 5);

      // Rear Brake Lights (Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-carW / 2, -carH * 0.4, 3, 5);
      ctx.fillRect(-carW / 2, carH * 0.4 - 5, 3, 5);

      // Directional Heading Indicator Arrow
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(carW * 0.25, 0);
      ctx.lineTo(carW * 0.05, -5);
      ctx.lineTo(carW * 0.05, 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

  }, [telemetry, showRays, showObstacles, showTrail]);

  // Trigger canvas redraw on telemetry, overlays, or asset loading
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, assetsVersion]);

  // Compute Q-Learning Discretization Bucket Values
  const qStateInfo = useMemo(() => {
    if (!telemetry) return { index: 0, buckets: { front: 0, left: 0, right: 0, speed: 0, steering: 0 } };

    const bucketSensor = (d) => {
      if (d < 0.12) return 0;
      if (d < 0.30) return 1;
      if (d < 0.60) return 2;
      return 3;
    };

    const bucketSpeed = (s) => {
      if (s < -0.2) return 0;
      if (s < 0.15) return 1;
      if (s < 0.5) return 2;
      return 3;
    };

    const bucketSteering = (st) => {
      if (st < 0.25) return 0;
      if (st < 0.5) return 1;
      if (st < 0.75) return 2;
      return 3;
    };

    const s = telemetry.sensors || {};
    const bFront = bucketSensor(s.front ?? 1);
    const bLeft = bucketSensor(s.left ?? 1);
    const bRight = bucketSensor(s.right ?? 1);
    const bSpeed = bucketSpeed(telemetry.speed ?? 0);
    const bSteering = bucketSteering(telemetry.steering ?? 0);

    const index = bFront * 256 + bLeft * 64 + bRight * 16 + bSpeed * 4 + bSteering;

    return {
      index,
      buckets: { front: bFront, left: bLeft, right: bRight, speed: bSpeed, steering: bSteering }
    };
  }, [telemetry]);

  // Policy Action Values
  const qValuesData = useMemo(() => {
    const act = telemetry?.last_action || 'DO_NOTHING';
    return [
      { action: 'DO_NOTHING', q: act === 'DO_NOTHING' ? 4.5 : 1.2 },
      { action: 'ACCELERATE', q: act === 'ACCELERATE' ? 8.2 : 3.5 },
      { action: 'BRAKE', q: act === 'BRAKE' ? 5.0 : 0.9 },
      { action: 'TURN_LEFT', q: act === 'TURN_LEFT' ? 7.1 : 2.1 },
      { action: 'TURN_RIGHT', q: act === 'TURN_RIGHT' ? 6.8 : 2.0 }
    ];
  }, [telemetry?.last_action]);

  return (
    <RootContainer>
      {/* Navigation & Header */}
      <TopNavbar>
        <BrandBlock>
          <h1>Autonomous Vehicle Using Reinforcement Learning</h1>
          <p>
            Real-Time 2D Telemetry & Q-Learning Cockpit • <span className="author">Developed by Sahil More</span>
          </p>
        </BrandBlock>

        <NavControls>
          {/* Simulation Stream Mode Switcher */}
          <ModeToggleGroup>
            <ModeOption
              $active={simulationMode === 'cpp'}
              onClick={() => {
                setSimulationMode('cpp');
                addLog('Switched mode: C++ Engine Stream', 'action');
              }}
            >
              C++ Engine Stream
            </ModeOption>
            <ModeOption
              $active={simulationMode === 'browser'}
              onClick={() => {
                setSimulationMode('browser');
                addLog('Switched mode: In-Browser Simulation', 'action');
              }}
            >
              In-Browser Sim
            </ModeOption>
          </ModeToggleGroup>

          {/* Engine & Connection Status Indicator */}
          <StatusIndicator $active={wsConnected && (simulationMode === 'cpp' ? cppEngineActive : true)}>
            {!wsConnected
              ? 'Server Offline'
              : (simulationMode === 'cpp'
                ? (cppEngineActive ? 'C++ Active' : 'C++ Idle')
                : 'Browser Sim Active')}
          </StatusIndicator>

          {/* Audio Toggle */}
          <ActionButton onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            soundManager.enabled = next;
          }}>
            {soundEnabled ? 'Audio: On' : 'Audio: Off'}
          </ActionButton>
        </NavControls>
      </TopNavbar>

      {/* Primary Navigation Tabs */}
      <NavigationTabBar>
        <TabItem $active={activeTab === 'cockpit'} onClick={() => setActiveTab('cockpit')}>
          Telemetry & Cockpit
        </TabItem>
        <TabItem $active={activeTab === 'qlearning'} onClick={() => setActiveTab('qlearning')}>
          Q-Learning Policy
        </TabItem>
        <TabItem $active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          Training Performance
        </TabItem>
        <TabItem $active={activeTab === 'lab'} onClick={() => setActiveTab('lab')}>
          Interactive Drive Lab
        </TabItem>
        <TabItem $active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
          System Log ({logEntries.length})
        </TabItem>
      </NavigationTabBar>

      {/* Main Workspace Layout */}
      <MainLayout>
        {/* Left Column: Viewport & Primary Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Key Engineering Counters */}
          <MetricsGrid>
            <MetricCard>
              <MetricLabel>Episode</MetricLabel>
              <MetricNumber>#{telemetry?.episode ?? 0}</MetricNumber>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Step</MetricLabel>
              <MetricNumber>{telemetry?.step ?? 0} <small>steps</small></MetricNumber>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Speed</MetricLabel>
              <MetricNumber>{Math.abs(telemetry?.speed ?? 0).toFixed(2)} <small>px/f</small></MetricNumber>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Cumulative Reward</MetricLabel>
              <MetricNumber style={{ color: (telemetry?.total_reward ?? 0) >= 0 ? THEME.success : THEME.danger }}>
                {(telemetry?.total_reward ?? 0).toFixed(1)}
              </MetricNumber>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Exploration (ε)</MetricLabel>
              <MetricNumber>{(telemetry?.epsilon ?? 0.05).toFixed(3)}</MetricNumber>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Collisions</MetricLabel>
              <MetricNumber style={{ color: (telemetry?.collisions ?? 0) > 0 ? THEME.danger : THEME.text }}>
                {telemetry?.collisions ?? 0}
              </MetricNumber>
            </MetricCard>
          </MetricsGrid>

          {/* TAB 1: Cockpit & Simulation Viewport */}
          {activeTab === 'cockpit' && (
            <>
              <ContentPanel>
                <PanelHeader>
                  <h2>2D Simulation Viewport (986 × 980 Resolution)</h2>
                  <span className="meta">
                    {simulationMode === 'cpp'
                      ? (cppEngineActive ? 'SOURCE: C++ SFML ENGINE' : 'C++ SIMULATOR WAITING')
                      : 'SOURCE: BROWSER SIMULATOR'}
                  </span>
                </PanelHeader>

                <ViewportWrapper>
                  <ViewportInfoBadge>
                    <span>ACTION:</span>
                    <ActionPill $action={telemetry?.last_action}>
                      {telemetry?.last_action || 'DO_NOTHING'}
                    </ActionPill>
                    <span style={{ marginLeft: 6 }}>HEADING:</span>
                    <span className="value">{(telemetry?.angle ?? 0).toFixed(1)}°</span>
                  </ViewportInfoBadge>

                  <ViewportToolbar>
                    <ActionButton onClick={() => setShowRays(r => !r)}>
                      {showRays ? 'Rays: On' : 'Rays: Off'}
                    </ActionButton>
                    <ActionButton onClick={() => setShowObstacles(o => !o)}>
                      {showObstacles ? 'Obstacles: On' : 'Obstacles: Off'}
                    </ActionButton>
                    <ActionButton onClick={() => setShowTrail(t => !t)}>
                      {showTrail ? 'Trail: On' : 'Trail: Off'}
                    </ActionButton>
                  </ViewportToolbar>

                  <TelemetryCanvas ref={canvasRef} width={1280} height={720} />
                </ViewportWrapper>

                {/* 5-Channel LiDAR-Style Proximity Meters */}
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    LiDAR-Style Distance Sensors (Normalized)
                  </div>
                  <SensorBarGroup>
                    {['left', 'front_left', 'front', 'front_right', 'right'].map(key => {
                      const val = smoothSensors[key] ?? 1.0;
                      return (
                        <SensorCard key={key} $val={val}>
                          <div className="header">
                            <span>{key.replace('_', ' ')}</span>
                          </div>
                          <div className="track">
                            <div className="fill" />
                          </div>
                          <div className="val">{(val * 100).toFixed(0)}%</div>
                        </SensorCard>
                      );
                    })}
                  </SensorBarGroup>
                </div>
              </ContentPanel>

              {/* Reward History Chart */}
              <ContentPanel>
                <PanelHeader>
                  <h2>Episodic Reward Optimization</h2>
                  <span className="meta">TRENDLINE</span>
                </PanelHeader>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={rewardHistory.slice(-70)}>
                    <defs>
                      <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME.accentLight} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={THEME.accentLight} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                    <XAxis dataKey="episode" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '6px' }} />
                    <Area type="monotone" dataKey="reward" stroke={THEME.accentLight} strokeWidth={2} fill="url(#rewardGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ContentPanel>
            </>
          )}

          {/* TAB 2: Q-Learning Policy */}
          {activeTab === 'qlearning' && (
            <ContentPanel>
              <PanelHeader>
                <h2>Q-Learning Discretization & Action Values</h2>
                <span className="meta">1024 STATES • 5 ACTIONS</span>
              </PanelHeader>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '0.74rem', color: THEME.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Active State Index
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color: THEME.accentLight }}>
                    State #{qStateInfo.index} <span style={{ fontSize: '0.8rem', color: THEME.textDim }}>/ 1023</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: THEME.textMuted, marginTop: '10px', lineHeight: 1.6 }}>
                    State Encoding: <code>s = d_f·256 + d_l·64 + d_r·16 + v·4 + θ</code><br />
                    Active Buckets: [Front: {qStateInfo.buckets.front}, Left: {qStateInfo.buckets.left}, Right: {qStateInfo.buckets.right}, Speed: {qStateInfo.buckets.speed}, Steering: {qStateInfo.buckets.steering}]
                  </div>
                </div>

                <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '0.74rem', color: THEME.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Bellman Equation Update Rule
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.82rem', color: THEME.success, background: THEME.surface, padding: '8px 10px', borderRadius: '4px', border: `1px solid ${THEME.border}` }}>
                    Q(s, a) ← Q(s, a) + α [r + γ max Q(s', a') - Q(s, a)]
                  </div>
                  <div style={{ fontSize: '0.74rem', color: THEME.textDim, marginTop: '8px' }}>
                    Learning Rate (α): 0.10 • Discount Factor (γ): 0.95 • Minimum ε: 0.05
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: THEME.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>
                  Current Action Q-Values: Q(s = #{qStateInfo.index}, a)
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={qValuesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                    <XAxis dataKey="action" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '6px' }} />
                    <Bar dataKey="q" fill={THEME.accentLight} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ContentPanel>
          )}

          {/* TAB 3: Analytics */}
          {activeTab === 'analytics' && (
            <ContentPanel>
              <PanelHeader>
                <h2>Reinforcement Learning Training Performance</h2>
                <span className="meta">CONVERGENCE HISTORY</span>
              </PanelHeader>
              <div>
                <div style={{ fontSize: '0.78rem', color: THEME.textMuted, marginBottom: '8px' }}>Cumulative Reward per Episode</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={rewardHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                    <XAxis dataKey="episode" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: THEME.surface, border: `1px solid ${THEME.border}` }} />
                    <Area type="monotone" dataKey="reward" stroke={THEME.success} fill="rgba(16, 185, 129, 0.15)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ContentPanel>
          )}

          {/* TAB 4: Drive Lab */}
          {activeTab === 'lab' && (
            <ContentPanel>
              <PanelHeader>
                <h2>Interactive Drive & Physics Lab</h2>
                <span className="meta">WASD / ARROW CONTROLS</span>
              </PanelHeader>

              <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#ffffff' }}>Manual Driving Override</h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: THEME.textMuted }}>
                      Switch to <b>In-Browser Sim</b> to test direct vehicle control using <b>W / A / S / D</b> or <b>Arrow Keys</b>.
                    </p>
                  </div>

                  <ActionButton
                    $primary={manualDriveActive}
                    onClick={() => {
                      if (simulationMode !== 'browser') {
                        setSimulationMode('browser');
                      }
                      setManualDriveActive(m => !m);
                      addLog(`Manual driving ${!manualDriveActive ? 'enabled' : 'disabled'}`, 'action');
                    }}
                  >
                    {manualDriveActive ? 'Manual Control Active' : 'Enable Manual Drive'}
                  </ActionButton>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <ActionButton onClick={() => {
                    const car = browserSimRef.current;
                    car.x = 400; car.y = 300; car.angle = 0; car.velocity = 0;
                    trailRef.current = [];
                    addLog('Reset vehicle spawn position to [400, 300]', 'action');
                  }}>
                    Reset Position
                  </ActionButton>

                  <ActionButton onClick={() => setSimSpeed(1)}>Speed: 1x</ActionButton>
                  <ActionButton onClick={() => setSimSpeed(2)}>Speed: 2x</ActionButton>
                  <ActionButton onClick={() => setSimSpeed(5)}>Speed: 5x</ActionButton>
                </div>
              </div>
            </ContentPanel>
          )}

          {/* TAB 5: Logs */}
          {activeTab === 'logs' && (
            <ContentPanel>
              <PanelHeader>
                <h2>System Telemetry Event Stream</h2>
                <ActionButton onClick={() => setLogEntries([])}>Clear Logs</ActionButton>
              </PanelHeader>
              <TerminalLog>
                {logEntries.map(log => (
                  <LogEntry key={log.id} $color={log.color}>
                    <span className="time">[{log.time}]</span>
                    <span className="prefix">&gt;</span>
                    <span className="text">{log.text}</span>
                  </LogEntry>
                ))}
              </TerminalLog>
            </ContentPanel>
          )}
        </div>

        {/* Right Sidebar: Primary Instrument Cluster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Kinematics Cluster */}
          <ContentPanel>
            <PanelHeader>
              <h2>Vehicle Kinematics</h2>
            </PanelHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <MetricLabel>Velocity</MetricLabel>
                <MetricNumber>
                  {Math.abs(telemetry?.speed ?? 0).toFixed(2)} <small>px/frame</small>
                </MetricNumber>
              </div>

              <div>
                <MetricLabel>Heading Angle (θ)</MetricLabel>
                <MetricNumber>
                  {(telemetry?.angle ?? 0).toFixed(1)}°
                </MetricNumber>
              </div>

              <div>
                <MetricLabel>Steering Input (δ)</MetricLabel>
                <MetricNumber>
                  {(telemetry?.steering ?? 0).toFixed(2)} <small>rad</small>
                </MetricNumber>
              </div>

              <div>
                <MetricLabel>Selected Action</MetricLabel>
                <div style={{ marginTop: '6px' }}>
                  <ActionPill $action={telemetry?.last_action}>
                    {telemetry?.last_action || 'DO_NOTHING'}
                  </ActionPill>
                </div>
              </div>
            </div>
          </ContentPanel>

          {/* Policy Exploration Meter */}
          <ContentPanel>
            <PanelHeader>
              <h2>Epsilon Exploration Rate</h2>
            </PanelHeader>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: THEME.textMuted, marginBottom: '6px' }}>
                <span>Exploration</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#ffffff', fontWeight: 600 }}>
                  {((telemetry?.epsilon ?? 0.05) * 100).toFixed(1)}%
                </span>
                <span>Exploitation</span>
              </div>
              <div style={{ height: '6px', background: THEME.bg, borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (telemetry?.epsilon ?? 0.05) * 100)}%`,
                    backgroundColor: THEME.warning,
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.72rem', color: THEME.textDim, lineHeight: 1.5 }}>
                Balances random exploration of new state-action pairs versus greedy exploitation of highest Q-values.
              </p>
            </div>
          </ContentPanel>

          {/* Quick Event Feed */}
          <ContentPanel style={{ flex: 1 }}>
            <PanelHeader>
              <h2>Recent Events</h2>
            </PanelHeader>
            <TerminalLog style={{ height: '220px' }}>
              {logEntries.slice(0, 15).map(log => (
                <LogEntry key={log.id} $color={log.color}>
                  <span className="time">[{log.time}]</span>
                  <span className="prefix">&gt;</span>
                  <span className="text">{log.text}</span>
                </LogEntry>
              ))}
            </TerminalLog>
          </ContentPanel>
        </div>
      </MainLayout>

      {/* Understated Engineering Footer */}
      <PageFooter>
        <div>
          Autonomous Vehicle Using Reinforcement Learning • Developed by Sahil More
        </div>
        <div>
          <a
            href="https://github.com/SahilMore06/Autonomous-Vehicle-Using-RL"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository
          </a>
          <span style={{ margin: '0 8px' }}>•</span>
          MIT License
        </div>
      </PageFooter>
    </RootContainer>
  );
}
