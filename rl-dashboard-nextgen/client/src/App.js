import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { COLLISION_OBSTACLES } from './collisionData';

// --- Keyframes & Micro-Animations ---
const pulseGlow = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const scanline = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`;

// --- Styled Components ---
const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 50% 15%, #0e1222 0%, #06070c 100%);
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  position: relative;
  padding-bottom: 40px;

  &::before {
    content: "";
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at 20% 20%, rgba(0, 242, 255, 0.04) 0%, transparent 40%),
                radial-gradient(circle at 80% 80%, rgba(121, 40, 202, 0.04) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 16px 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(8, 10, 18, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 242, 255, 0.2);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
  }
`;

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(121, 40, 202, 0.3));
  border: 1px solid rgba(0, 242, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
  position: relative;
`;

const Title = styled.h1`
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 30%, #00f2ff 75%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  span {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 2px;
    color: #64748b;
    text-transform: uppercase;
    -webkit-text-fill-color: #94a3b8;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const StatusPill = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: ${props => props.$active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.$active ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: ${props => props.$active ? '#10b981' : '#ef4444'};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$active ? '#10b981' : '#ef4444'};
    box-shadow: 0 0 8px ${props => props.$active ? '#10b981' : '#ef4444'};
    animation: ${props => props.$active ? pulseGlow : 'none'} 2s infinite ease-in-out;
  }
`;

const NavTabs = styled.div`
  display: flex;
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const TabButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(121, 40, 202, 0.2))' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(0, 242, 255, 0.5)' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#94a3b8'};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ControlButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 242, 255, 0.15);
    border-color: rgba(0, 242, 255, 0.4);
    color: #00f2ff;
  }
`;

const DashboardGrid = styled.main`
  max-width: 1720px;
  margin: 28px auto 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  position: relative;
  z-index: 1;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    padding: 0 16px;
    margin-top: 16px;
  }
`;

const GlassPanel = styled.section`
  background: rgba(14, 18, 33, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;

  ${props => props.$highlight && css`
    border-top: 2px solid ${props.$color || '#00f2ff'};
    box-shadow: 0 4px 20px -2px ${props.$color ? `${props.$color}33` : 'rgba(0, 242, 255, 0.2)'};
  `}
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #f1f5f9;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  span.badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(0, 242, 255, 0.1);
    color: #00f2ff;
    border: 1px solid rgba(0, 242, 255, 0.25);
  }
`;

// Stat Cards Grid
const StatCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(18, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-left: 3px solid ${props => props.$color || '#00f2ff'};
  border-radius: 12px;
  padding: 16px 18px;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(18, 23, 42, 0.8);
  }
`;

const StatLabel = styled.div`
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #94a3b8;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatValue = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: baseline;
  gap: 6px;

  small {
    font-size: 0.78rem;
    font-weight: 500;
    color: #64748b;
  }
`;

// Canvas Viewport
const CanvasWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  background: #090a12;
  border: 1px solid rgba(0, 242, 255, 0.2);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8);

  &::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #00f2ff, transparent);
    animation: ${scanline} 6s linear infinite;
    opacity: 0.4;
    pointer-events: none;
    z-index: 5;
  }
`;

const SimulationCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: auto;
`;

const CanvasOverlay = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const OverlayBadge = styled.div`
  background: rgba(6, 8, 16, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    color: ${props => props.$color || '#00f2ff'};
    font-weight: 700;
  }
`;

const CanvasBottomControls = styled.div`
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

// Action Pill
const ActionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  background: ${props => {
    switch (props.$action) {
      case 'ACCELERATE': return 'rgba(16, 185, 129, 0.15)';
      case 'BRAKE': return 'rgba(239, 68, 68, 0.15)';
      case 'TURN_LEFT': return 'rgba(59, 130, 246, 0.15)';
      case 'TURN_RIGHT': return 'rgba(168, 85, 247, 0.15)';
      default: return 'rgba(148, 163, 184, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$action) {
      case 'ACCELERATE': return '#10b981';
      case 'BRAKE': return '#ef4444';
      case 'TURN_LEFT': return '#38bdf8';
      case 'TURN_RIGHT': return '#c084fc';
      default: return '#94a3b8';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$action) {
      case 'ACCELERATE': return 'rgba(16, 185, 129, 0.4)';
      case 'BRAKE': return 'rgba(239, 68, 68, 0.4)';
      case 'TURN_LEFT': return 'rgba(59, 130, 246, 0.4)';
      case 'TURN_RIGHT': return 'rgba(168, 85, 247, 0.4)';
      default: return 'rgba(148, 163, 184, 0.2)';
    }
  }};
`;

// Terminal Log Stream
const Terminal = styled.div`
  background: #05060b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  height: 380px;
  overflow-y: auto;
  color: #38bdf8;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
`;

const TerminalLine = styled.div`
  margin-bottom: 6px;
  line-height: 1.5;
  display: flex;
  gap: 8px;
  color: ${props => props.$color || '#94a3b8'};

  span.time {
    color: #475569;
    user-select: none;
  }
  span.prefix {
    color: #00f2ff;
  }
`;

// Sensor Radar Grid
const SensorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 14px;
`;

const SensorMeter = styled.div`
  background: rgba(18, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
  text-align: center;

  div.label {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
  }

  div.bar-bg {
    height: 48px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  div.bar-fill {
    width: 100%;
    height: ${props => Math.min(100, (props.$val || 0) * 100)}%;
    background: ${props => {
      const v = props.$val || 0;
      if (v < 0.2) return '#ef4444';
      if (v < 0.5) return '#f59e0b';
      return '#10b981';
    }};
    transition: height 0.2s ease, background 0.2s ease;
  }

  div.val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 6px;
    color: #ffffff;
  }
`;

// Helper Sound Generator using Web Audio API
class AudioFeedback {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBeep(freq = 600, duration = 0.08, type = 'sine') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy handled
    }
  }

  playCollision() {
    this.playBeep(180, 0.25, 'sawtooth');
  }

  playAction() {
    this.playBeep(880, 0.04, 'triangle');
  }
}

const audioFX = new AudioFeedback();

// ==========================================
// Main Autonomous Vehicle Dashboard App
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('cockpit'); // 'cockpit', 'qlearning', 'metrics', 'lab', 'logs'
  const [state, setState] = useState(null);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showRays, setShowRays] = useState(true);
  const [showHitboxes, setShowHitboxes] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [simulationMode, setSimulationMode] = useState('auto'); // 'auto', 'cpp', 'browser'
  const [browserSimSpeed, setBrowserSimSpeed] = useState(1);
  const [manualControlActive, setManualControlActive] = useState(false);

  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const trailRef = useRef([]);
  const bgImageRef = useRef(null);
  const carImageRef = useRef(null);

  // In-browser RL Simulation State
  const browserCarRef = useRef({
    x: 400,
    y: 300,
    angle: 0,
    velocity: 0,
    steering: 0,
    episode: 1,
    step: 0,
    totalReward: 0,
    collisions: 0,
    epsilon: 0.4,
    lastAction: 'DO_NOTHING'
  });

  // Load static assets
  useEffect(() => {
    const bg = new Image();
    bg.src = '/simulator-assets/city.jpg';
    bg.onload = () => { bgImageRef.current = bg; };

    const car = new Image();
    car.src = '/simulator-assets/car sprite.png';
    car.onload = () => { carImageRef.current = car; };
  }, []);

  // Audio Toggle Handler
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioFX.enabled = next;
    if (next) audioFX.playBeep(1000, 0.1);
  };

  const addLog = useCallback((text, type = 'info') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    let color = '#94a3b8';
    if (type === 'collision') color = '#ef4444';
    if (type === 'action') color = '#38bdf8';
    if (type === 'reward') color = '#10b981';
    if (type === 'episode') color = '#c084fc';

    setLogs(prev => [
      { id: Math.random().toString(), time: timeStr, text, color },
      ...prev.slice(0, 100)
    ]);
  }, []);

  // WebSocket Connection to Node.js Backend
  useEffect(() => {
    let reconnectTimer = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        addLog('Connected to Telemetry Bridge (ws://)', 'action');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state_update') {
            setState(msg.data);
            if (msg.data.collisions > 0) {
              audioFX.playCollision();
            }
          } else if (msg.type === 'init' || msg.type === 'history') {
            if (msg.data) setState(msg.data);
            if (msg.rewardHistory) setRewardHistory(msg.rewardHistory);
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [addLog]);

  // Raycasting Sensor Helper Function for Built-in Simulator
  const castRaySensor = useCallback((ox, oy, angleDeg, maxDist = 300) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const stepSize = 4;
    let dist = 0;

    while (dist < maxDist) {
      const px = ox + cosA * dist;
      const py = oy + sinA * dist;

      // Track boundaries
      if (px <= 0 || px >= 986 || py <= 0 || py >= 980) {
        return dist / maxDist;
      }

      // Check collision with obstacles
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

  // Built-in Browser Simulation Engine (Runs smoothly if C++ is not currently broadcasting)
  useEffect(() => {
    if (simulationMode === 'cpp' || (connected && state?.step && simulationMode === 'auto')) {
      return; // C++ engine is handling updates
    }

    const interval = setInterval(() => {
      const car = browserCarRef.current;
      car.step += 1;

      // Simple AI action selection if manual control is off
      if (!manualControlActive) {
        const sFront = castRaySensor(car.x, car.y, car.angle);
        const sLeft = castRaySensor(car.x, car.y, car.angle - 45);
        const sRight = castRaySensor(car.x, car.y, car.angle + 45);

        if (sFront < 0.25) {
          if (sLeft > sRight) {
            car.steering = -0.5;
            car.angle -= 12;
            car.velocity = Math.max(1.2, car.velocity * 0.85);
            car.lastAction = 'TURN_LEFT';
          } else {
            car.steering = 0.5;
            car.angle += 12;
            car.velocity = Math.max(1.2, car.velocity * 0.85);
            car.lastAction = 'TURN_RIGHT';
          }
        } else {
          car.velocity = Math.min(3.5, car.velocity + 0.15);
          car.steering = 0;
          car.lastAction = 'ACCELERATE';
        }
      }

      // Kinematics update
      const rad = (car.angle * Math.PI) / 180;
      car.x += Math.cos(rad) * car.velocity;
      car.y += Math.sin(rad) * car.velocity;

      // Boundary check
      let collided = false;
      if (car.x < 30 || car.x > 950 || car.y < 30 || car.y > 950) {
        collided = true;
      } else {
        for (const obs of COLLISION_OBSTACLES) {
          if (car.x >= obs.x && car.x <= obs.x + obs.width && car.y >= obs.y && car.y <= obs.y + obs.height) {
            collided = true;
            break;
          }
        }
      }

      const sensors = {
        front: castRaySensor(car.x, car.y, car.angle),
        front_left: castRaySensor(car.x, car.y, car.angle - 45),
        front_right: castRaySensor(car.x, car.y, car.angle + 45),
        left: castRaySensor(car.x, car.y, car.angle - 90),
        right: castRaySensor(car.x, car.y, car.angle + 90)
      };

      if (collided) {
        car.collisions += 1;
        car.totalReward -= 10;
        audioFX.playCollision();
        addLog(`Collision in Episode #${car.episode} at Step ${car.step}`, 'collision');

        // Reset car to initial spawn point
        car.episode += 1;
        car.step = 0;
        car.x = 400;
        car.y = 300;
        car.angle = 0;
        car.velocity = 0;
        car.totalReward = 0;
        car.epsilon = Math.max(0.05, car.epsilon * 0.995);
      } else {
        car.totalReward += 0.2 + (car.velocity * 0.1);
      }

      const browserState = {
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

      setState(browserState);

      if (car.step % 15 === 0) {
        setRewardHistory(prev => [
          ...prev.slice(-300),
          { episode: car.episode, reward: car.totalReward, epsilon: car.epsilon }
        ]);
      }
    }, 40 / browserSimSpeed);

    return () => clearInterval(interval);
  }, [simulationMode, connected, state?.step, castRaySensor, manualControlActive, browserSimSpeed, addLog]);

  // Keyboard Event Listeners for Manual Control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!manualControlActive) return;
      const car = browserCarRef.current;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        car.velocity = Math.min(4.5, car.velocity + 0.3);
        car.lastAction = 'ACCELERATE';
        audioFX.playAction();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        car.velocity = Math.max(-1.5, car.velocity - 0.4);
        car.lastAction = 'BRAKE';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        car.angle -= 10;
        car.lastAction = 'TURN_LEFT';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        car.angle += 10;
        car.lastAction = 'TURN_RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [manualControlActive]);

  // Main 2D Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Environment Background
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, width, height);
      // Dark overlay for sci-fi look
      ctx.fillStyle = 'rgba(6, 8, 16, 0.45)';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Procedural asphalt circuit
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    const simW = state?.window_width || 986;
    const simH = state?.window_height || 980;
    const sx = width / simW;
    const sy = height / simH;

    // 2. Draw Obstacle Bounding Boxes (if toggled)
    if (showHitboxes) {
      ctx.lineWidth = 1.5;
      for (const obs of COLLISION_OBSTACLES) {
        const ox = obs.x * sx;
        const oy = obs.y * sy;
        const ow = obs.width * sx;
        const oh = obs.height * sy;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.strokeRect(ox, oy, ow, oh);
      }
    }

    if (!state) return;

    const posX = (state.position?.x ?? 400) * sx;
    const posY = (state.position?.y ?? 300) * sy;
    const angleRad = ((state.angle ?? 0) * Math.PI) / 180;

    // 3. Draw Vehicle Trajectory Trail
    if (showTrail) {
      trailRef.current.push({ x: posX, y: posY });
      if (trailRef.current.length > 80) trailRef.current.shift();

      if (trailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    // 4. Draw LiDAR / Sensor Rays
    if (showRays) {
      const sensors = state.sensors || {};
      const rayAngles = [0, -Math.PI / 4, Math.PI / 4, -Math.PI / 2, Math.PI / 2];
      const sensorKeys = ['front', 'front_left', 'front_right', 'left', 'right'];

      sensorKeys.forEach((key, idx) => {
        const sDist = sensors[key] ?? 1.0;
        const beamAngle = angleRad + rayAngles[idx];
        const beamLength = 160 * sDist * sx;
        const targetX = posX + beamLength * Math.cos(beamAngle);
        const targetY = posY + beamLength * Math.sin(beamAngle);

        // Color based on safety distance
        let rayColor = 'rgba(16, 185, 129, 0.65)'; // Safe
        if (sDist < 0.25) rayColor = 'rgba(239, 68, 68, 0.85)'; // Danger
        else if (sDist < 0.55) rayColor = 'rgba(245, 158, 11, 0.75)'; // Caution

        // Laser beam
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hit point pulse dot
        ctx.beginPath();
        ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
        ctx.fillStyle = rayColor;
        ctx.fill();
      });
    }

    // 5. Draw Vehicle
    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(angleRad);

    if (carImageRef.current) {
      const carW = 38 * sx;
      const carH = 20 * sy;
      ctx.drawImage(carImageRef.current, -carW / 2, -carH / 2, carW, carH);
    } else {
      // Sleek Procedural Race Car
      ctx.shadowColor = '#00f2ff';
      ctx.shadowBlur = 12;

      // Chassis body
      ctx.fillStyle = '#00f2ff';
      ctx.beginPath();
      ctx.roundRect(-18, -9, 36, 18, 4);
      ctx.fill();

      // Cabin windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-4, -6, 16, 12, 2);
      ctx.fill();

      // Headlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, -7, 3, 3);
      ctx.fillRect(15, 4, 3, 3);

      ctx.shadowBlur = 0;
    }
    ctx.restore();

  }, [state, showRays, showHitboxes, showTrail]);

  // Compute Active State Index & Discrete Buckets for Q-Learning Tab
  const qStateInfo = useMemo(() => {
    if (!state) return { index: 0, buckets: { front: 0, left: 0, right: 0, speed: 0, steering: 0 } };

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

    const sensors = state.sensors || {};
    const bFront = bucketSensor(sensors.front ?? 1);
    const bLeft = bucketSensor(sensors.left ?? 1);
    const bRight = bucketSensor(sensors.right ?? 1);
    const bSpeed = bucketSpeed(state.speed ?? 0);
    const bSteering = bucketSteering(state.steering ?? 0);

    const index = bFront * 256 + bLeft * 64 + bRight * 16 + bSpeed * 4 + bSteering;

    return {
      index,
      buckets: { front: bFront, left: bLeft, right: bRight, speed: bSpeed, steering: bSteering }
    };
  }, [state]);

  // Mock Q-Values for Policy Visualization
  const qValuesData = useMemo(() => {
    const act = state?.last_action || 'DO_NOTHING';
    return [
      { action: 'DO_NOTHING', q: act === 'DO_NOTHING' ? 4.2 : 1.1 },
      { action: 'ACCELERATE', q: act === 'ACCELERATE' ? 8.5 : 3.8 },
      { action: 'BRAKE', q: act === 'BRAKE' ? 5.1 : 0.8 },
      { action: 'TURN_LEFT', q: act === 'TURN_LEFT' ? 7.2 : 2.4 },
      { action: 'TURN_RIGHT', q: act === 'TURN_RIGHT' ? 6.9 : 2.1 }
    ];
  }, [state?.last_action]);

  return (
    <Container>
      {/* Top Navigation Bar */}
      <Header>
        <BrandSection>
          <LogoBadge>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f2ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </LogoBadge>
          <Title>
            Autonomous Vehicle Using RL
            <span>Intelligent Telemetry & Simulation Cockpit</span>
          </Title>
        </BrandSection>

        <HeaderControls>
          <NavTabs>
            <TabButton $active={activeTab === 'cockpit'} onClick={() => setActiveTab('cockpit')}>
              Cockpit & HUD
            </TabButton>
            <TabButton $active={activeTab === 'qlearning'} onClick={() => setActiveTab('qlearning')}>
              Q-Learning Matrix
            </TabButton>
            <TabButton $active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')}>
              Training Analytics
            </TabButton>
            <TabButton $active={activeTab === 'lab'} onClick={() => setActiveTab('lab')}>
              Drive Lab
            </TabButton>
            <TabButton $active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
              Logs ({logs.length})
            </TabButton>
          </NavTabs>

          <StatusPill $active={connected}>
            {connected ? 'LIVE TELEMETRY' : 'BROWSER SIM ACTIVE'}
          </StatusPill>

          <select
            value={simulationMode}
            onChange={(e) => {
              setSimulationMode(e.target.value);
              addLog(`Simulation stream mode changed to: ${e.target.value.toUpperCase()}`, 'action');
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(0, 242, 255, 0.3)',
              color: '#00f2ff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="auto">Auto Stream</option>
            <option value="browser">Browser Sim</option>
            <option value="cpp">C++ Native</option>
          </select>

          <ControlButton onClick={toggleSound}>
            {soundEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
          </ControlButton>
        </HeaderControls>
      </Header>

      {/* Main Dashboard Grid */}
      <DashboardGrid>
        {/* Left Column: Visual Grid & Primary Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Stat Counters */}
          <StatCardsGrid>
            <StatCard $color="#00f2ff">
              <StatLabel>Cycle / Episode</StatLabel>
              <StatValue>#{state?.episode ?? 0}</StatValue>
            </StatCard>
            <StatCard $color="#7928ca">
              <StatLabel>Timesteps Processed</StatLabel>
              <StatValue>{state?.step ?? 0} <small>steps</small></StatValue>
            </StatCard>
            <StatCard $color="#10b981">
              <StatLabel>Cumulative Reward</StatLabel>
              <StatValue>{(state?.total_reward ?? 0).toFixed(1)}</StatValue>
            </StatCard>
            <StatCard $color="#f59e0b">
              <StatLabel>Exploration Rate (ε)</StatLabel>
              <StatValue>{(state?.epsilon ?? 0.05).toFixed(3)}</StatValue>
            </StatCard>
            <StatCard $color="#ef4444">
              <StatLabel>Total Collisions</StatLabel>
              <StatValue>{state?.collisions ?? 0}</StatValue>
            </StatCard>
          </StatCardsGrid>

          {/* TAB 1: Cockpit & Real-time HUD */}
          {activeTab === 'cockpit' && (
            <>
              <GlassPanel $highlight $color="#00f2ff">
                <SectionHeader>
                  <h2>Visual Telemetry Grid (986x980)</h2>
                  <span className="badge">60 FPS RADAR</span>
                </SectionHeader>

                <CanvasWrapper>
                  <CanvasOverlay>
                    <OverlayBadge $color="#00f2ff">
                      MODE: <span>{manualControlActive ? 'MANUAL WASD' : 'Q-LEARNING AI'}</span>
                    </OverlayBadge>
                    <OverlayBadge $color="#10b981">
                      ACTION: <ActionBadge $action={state?.last_action}>{state?.last_action || 'IDLE'}</ActionBadge>
                    </OverlayBadge>
                  </CanvasOverlay>

                  <CanvasBottomControls>
                    <ControlButton onClick={() => setShowRays(r => !r)}>
                      {showRays ? 'Hide Rays' : 'Show Rays'}
                    </ControlButton>
                    <ControlButton onClick={() => setShowHitboxes(h => !h)}>
                      {showHitboxes ? 'Hide Obstacles' : 'Show Obstacles'}
                    </ControlButton>
                    <ControlButton onClick={() => setShowTrail(t => !t)}>
                      {showTrail ? 'Hide Trail' : 'Show Trail'}
                    </ControlButton>
                  </CanvasBottomControls>

                  <SimulationCanvas ref={canvasRef} width={1280} height={720} />
                </CanvasWrapper>

                {/* 5-Channel LiDAR Sensor Grid */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    LiDAR Proximity Distance Sensors
                  </div>
                  <SensorGrid>
                    {['left', 'front_left', 'front', 'front_right', 'right'].map(key => {
                      const val = state?.sensors?.[key] ?? 1.0;
                      return (
                        <SensorMeter key={key} $val={val}>
                          <div className="label">{key.replace('_', ' ')}</div>
                          <div className="bar-bg">
                            <div className="bar-fill" />
                          </div>
                          <div className="val">{(val * 100).toFixed(0)}%</div>
                        </SensorMeter>
                      );
                    })}
                  </SensorGrid>
                </div>
              </GlassPanel>

              {/* Reward Optimization Trend */}
              <GlassPanel>
                <SectionHeader>
                  <h2>Real-Time Episodic Reward Trend</h2>
                  <span className="badge">OPTIMIZATION CONVERGENCE</span>
                </SectionHeader>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={rewardHistory.slice(-80)}>
                    <defs>
                      <linearGradient id="cyanReward" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="episode" stroke="#475569" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#090d1a', border: '1px solid rgba(0,242,255,0.4)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="reward" stroke="#00f2ff" strokeWidth={2.5} fill="url(#cyanReward)" />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassPanel>
            </>
          )}

          {/* TAB 2: Q-Learning Matrix */}
          {activeTab === 'qlearning' && (
            <GlassPanel $highlight $color="#7928ca">
              <SectionHeader>
                <h2>Q-Table State Discretization & Action Values</h2>
                <span className="badge">STATE SPACE: 1024 | ACTIONS: 5</span>
              </SectionHeader>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Current State Bucket Encoding</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', color: '#00f2ff', fontWeight: 700 }}>
                    State #{qStateInfo.index} <small style={{ color: '#64748b', fontSize: '0.8rem' }}>/ 1023</small>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '10px', lineHeight: 1.6 }}>
                    Formula: S = d<sub>f</sub>×256 + d<sub>l</sub>×64 + d<sub>r</sub>×16 + v×4 + st<br />
                    Buckets: [Front: {qStateInfo.buckets.front}, Left: {qStateInfo.buckets.left}, Right: {qStateInfo.buckets.right}, Speed: {qStateInfo.buckets.speed}, Steering: {qStateInfo.buckets.steering}]
                  </div>
                </div>

                <div style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Bellman Update Equation</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', color: '#10b981', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                    Q(s, a) ← Q(s, a) + α [r + γ max Q(s', a') - Q(s, a)]
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                    Learning Rate (α): 0.10 | Discount Factor (γ): 0.95 | ε-Decay: Exponential
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px', textTransform: 'uppercase' }}>
                Action-Value Distribution for Current State
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={qValuesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="action" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#090d1a', border: '1px solid rgba(121,40,202,0.4)', borderRadius: '8px' }} />
                  <Bar dataKey="q" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassPanel>
          )}

          {/* TAB 3: Training Metrics */}
          {activeTab === 'metrics' && (
            <GlassPanel $highlight $color="#10b981">
              <SectionHeader>
                <h2>Comprehensive Reinforcement Learning Analytics</h2>
                <span className="badge">PERFORMANCE BENCHMARKS</span>
              </SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    Reward Convergence History
                  </h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={rewardHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="episode" stroke="#475569" />
                      <YAxis stroke="#475569" />
                      <Tooltip contentStyle={{ background: '#090d1a', border: '1px solid #10b981' }} />
                      <Area type="monotone" dataKey="reward" stroke="#10b981" fill="rgba(16, 185, 129, 0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* TAB 4: Drive Lab */}
          {activeTab === 'lab' && (
            <GlassPanel $highlight $color="#f59e0b">
              <SectionHeader>
                <h2>Interactive Driving & Autopilot Lab</h2>
                <span className="badge">KEYBOARD OVERRIDE READY</span>
              </SectionHeader>

              <div style={{ background: 'rgba(15,23,42,0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#ffffff' }}>Manual Driving Override</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                      Take control of the vehicle using <b>W / A / S / D</b> or <b>Arrow Keys</b> to test manual driving dynamics.
                    </p>
                  </div>
                  <ControlButton
                    style={{
                      background: manualControlActive ? '#10b981' : 'rgba(255,255,255,0.06)',
                      color: manualControlActive ? '#000000' : '#ffffff',
                      fontWeight: 700
                    }}
                    onClick={() => {
                      setManualControlActive(m => !m);
                      addLog(`Manual Drive Mode: ${!manualControlActive ? 'ENABLED' : 'DISABLED'}`, 'action');
                    }}
                  >
                    {manualControlActive ? '🕹️ MANUAL DRIVE ACTIVE' : '⚡ ENABLE MANUAL DRIVE'}
                  </ControlButton>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <ControlButton onClick={() => {
                    const car = browserCarRef.current;
                    car.x = 400; car.y = 300; car.angle = 0; car.velocity = 0;
                    trailRef.current = [];
                    addLog('Vehicle spawn position reset to [400, 300]', 'action');
                  }}>
                    🔄 Reset Vehicle Position
                  </ControlButton>

                  <ControlButton onClick={() => setBrowserSimSpeed(1)}>Speed: 1x</ControlButton>
                  <ControlButton onClick={() => setBrowserSimSpeed(2)}>Speed: 2x</ControlButton>
                  <ControlButton onClick={() => setBrowserSimSpeed(5)}>Speed: 5x Turbo</ControlButton>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* TAB 5: Logs */}
          {activeTab === 'logs' && (
            <GlassPanel>
              <SectionHeader>
                <h2>Real-Time Decision & Telemetry Stream</h2>
                <ControlButton onClick={() => setLogs([])}>Clear Console</ControlButton>
              </SectionHeader>
              <Terminal>
                {logs.map(log => (
                  <TerminalLine key={log.id} $color={log.color}>
                    <span className="time">[{log.time}]</span>
                    <span className="prefix">&gt;</span>
                    {log.text}
                  </TerminalLine>
                ))}
              </Terminal>
            </GlassPanel>
          )}
        </div>

        {/* Right Sidebar: Cockpit Gauges & Telemetry */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Kinematics HUD */}
          <GlassPanel $highlight $color="#00f2ff">
            <SectionHeader>
              <h2>Kinematics HUD</h2>
            </SectionHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <StatLabel>Velocity / Speed</StatLabel>
                <StatValue style={{ color: '#00f2ff' }}>
                  {(state?.speed ?? 0).toFixed(2)} <small>px/frame</small>
                </StatValue>
              </div>

              <div>
                <StatLabel>Heading Orientation</StatLabel>
                <StatValue style={{ color: '#a855f7' }}>
                  {(state?.angle ?? 0).toFixed(1)}°
                </StatValue>
              </div>

              <div>
                <StatLabel>Steering Angle</StatLabel>
                <StatValue style={{ color: '#38bdf8' }}>
                  {(state?.steering ?? 0).toFixed(2)} <small>rad</small>
                </StatValue>
              </div>

              <div>
                <StatLabel>Current Selected Action</StatLabel>
                <div style={{ marginTop: '8px' }}>
                  <ActionBadge $action={state?.last_action}>
                    {state?.last_action || 'DO_NOTHING'}
                  </ActionBadge>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Exploration vs Exploitation Gauge */}
          <GlassPanel $highlight $color="#f59e0b">
            <SectionHeader>
              <h2>Policy Epsilon Decay</h2>
            </SectionHeader>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                <span>Exploration</span>
                <span style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  {((state?.epsilon ?? 0.05) * 100).toFixed(1)}%
                </span>
                <span>Exploitation</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (state?.epsilon ?? 0.05) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                    boxShadow: '0 0 10px #f59e0b'
                  }}
                />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
              Controls the balance between exploring unknown states versus exploiting known optimal actions from the Q-Table.
            </p>
          </GlassPanel>

          {/* Quick Decision Terminal Stream */}
          <GlassPanel style={{ flex: 1 }}>
            <SectionHeader>
              <h2>Live Event Stream</h2>
            </SectionHeader>
            <Terminal style={{ height: '240px' }}>
              {logs.slice(0, 15).map(log => (
                <TerminalLine key={log.id} $color={log.color}>
                  <span className="time">[{log.time}]</span>
                  <span className="prefix">&gt;</span>
                  {log.text}
                </TerminalLine>
              ))}
            </Terminal>
          </GlassPanel>
        </aside>
      </DashboardGrid>
    </Container>
  );
}
