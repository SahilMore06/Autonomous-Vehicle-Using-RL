import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { THEME } from './theme';
import { COLLISION_OBSTACLES } from './collisionData';

// Top-Level & Layout Components
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import MetricCards from './components/MetricCards';
import Simulation3D from './components/Simulation3D';
import VehicleView3D from './components/VehicleView3D';
import SensorRadar from './components/SensorRadar';
import TrainingProgressChart from './components/TrainingProgressChart';
import QLearningHeatmap from './components/QLearningHeatmap';
import EpisodeStatistics from './components/EpisodeStatistics';
import RecentEpisodes from './components/RecentEpisodes';

// Dedicated Section Views
import SimulationView from './components/views/SimulationView';
import AnalyticsView from './components/views/AnalyticsView';
import QLearningView from './components/views/QLearningView';
import EnvironmentView from './components/views/EnvironmentView';
import ManualControlView from './components/views/ManualControlView';
import SettingsView from './components/views/SettingsView';
import AboutView from './components/views/AboutView';

// --- Styled Layout Hierarchy ---
const DashboardRoot = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${THEME.bg};
  color: ${THEME.textPrimary};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
`;

const MainContentArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${THEME.border};
    border-radius: 3px;
  }
`;

const PageBody = styled.div`
  padding: 18px 24px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1720px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 900px) {
    padding: 14px 14px 28px 14px;
    gap: 14px;
  }
`;

// Dashboard Middle Row: Main 3D Simulation + Right Panels
const SimulationRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 310px;
  gap: 16px;
  align-items: stretch;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const RightPanelsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// Dashboard Bottom Row: 3 Analytics Panels
const AnalyticsRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.1fr 1fr;
  gap: 16px;

  @media (max-width: 1300px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

// Web Audio Alert Synthesizer
class AudioFeedbackManager {
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

  playCollisionBeep() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      // Audio autoplay policy handled safely
    }
  }
}

const audioManager = new AudioFeedbackManager();

export default function App() {
  // Navigation & View Routing State
  const [currentView, setCurrentView] = useState('dashboard');
  const [simulationMode, setSimulationMode] = useState('cpp'); // 'cpp', 'browser', 'training'
  const [manualDriveActive, setManualDriveActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Backend WebSocket & C++ Engine State
  const [wsConnected, setWsConnected] = useState(false);
  const [cppEngineActive, setCppEngineActive] = useState(false);
  const wsRef = useRef(null);

  // Telemetry Source of Truth
  const [telemetry, setTelemetry] = useState({
    episode: 61173,
    step: 184,
    total_reward: 342.8,
    avg_reward: 284.5,
    epsilon: 0.05,
    position: { x: 400, y: 300 },
    angle: 45,
    speed: 2.3,
    steering: 0.0,
    sensors: { front: 0.82, front_left: 0.94, front_right: 0.76, left: 1.0, right: 0.65 },
    collisions: 0,
    last_action: 'ACCELERATE',
    window_width: 986,
    window_height: 980
  });

  const [rewardHistory, setRewardHistory] = useState([]);

  // Local In-Browser Physics Reference (Active only in 'browser' or 'training' modes)
  const browserSimRef = useRef({
    x: 400,
    y: 300,
    angle: 0,
    velocity: 2.0,
    steering: 0,
    episode: 61173,
    step: 0,
    totalReward: 0,
    collisions: 0,
    epsilon: 0.05,
    lastAction: 'ACCELERATE'
  });

  // Sound enable sync
  useEffect(() => {
    audioManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // WebSocket Telemetry Connection to Node.js Backend
  useEffect(() => {
    let reconnectTimer = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state_update') {
            setCppEngineActive(msg.isLive);
            // ONLY apply C++ engine state if currently in 'cpp' mode
            if (simulationMode === 'cpp') {
              setTelemetry(msg.data);
              if (msg.data.collisions > 0) audioManager.playCollisionBeep();
            }
          } else if (msg.type === 'init' || msg.type === 'history') {
            if (msg.simulatorRunning !== undefined) setCppEngineActive(msg.simulatorRunning);
            if (msg.data && simulationMode === 'cpp') setTelemetry(msg.data);
            if (msg.rewardHistory && msg.rewardHistory.length > 0) {
              setRewardHistory(msg.rewardHistory);
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setCppEngineActive(false);
        reconnectTimer = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [simulationMode]);

  // Raycasting Sensor Distance Calculation (For browser simulation)
  const castRay = useCallback((ox, oy, angleDeg, maxDist = 320) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const stepSize = 4;
    let dist = 0;

    while (dist < maxDist) {
      const px = ox + cosA * dist;
      const py = oy + sinA * dist;

      // Track perimeter boundaries
      if (px <= 30 || px >= 956 || py <= 30 || py >= 950) {
        return dist / maxDist;
      }

      // Check collision obstacles
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

  // In-Browser Simulation Physics Loop (Executes when in 'browser' or 'training' mode)
  useEffect(() => {
    if (simulationMode === 'cpp' || isPaused) return;

    const intervalTime = Math.max(10, Math.floor(35 / simSpeed));
    const timer = setInterval(() => {
      const car = browserSimRef.current;
      car.step += 1;

      // Autopilot Q-Learning logic if manual control is not overriding
      if (!manualDriveActive) {
        const sFront = castRay(car.x, car.y, car.angle);
        const sLeft = castRay(car.x, car.y, car.angle - 45);
        const sRight = castRay(car.x, car.y, car.angle + 45);

        if (sFront < 0.32) {
          // Obstacle detected ahead: steer towards clearer direction
          if (sLeft > sRight) {
            car.steering = -0.35;
            car.angle -= 9;
            car.velocity = Math.max(1.2, car.velocity * 0.90);
            car.lastAction = 'TURN_LEFT';
          } else {
            car.steering = 0.35;
            car.angle += 9;
            car.velocity = Math.max(1.2, car.velocity * 0.90);
            car.lastAction = 'TURN_RIGHT';
          }
        } else {
          // Open road ahead: accelerate
          car.velocity = Math.min(3.6, car.velocity + 0.14);
          car.steering = 0;
          car.lastAction = 'ACCELERATE';
        }
      }

      // Kinematic motion updates
      const rad = (car.angle * Math.PI) / 180;
      car.x += Math.cos(rad) * car.velocity;
      car.y += Math.sin(rad) * car.velocity;

      // Boundary & Obstacle Collision Checks
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
        car.totalReward -= 12;
        audioManager.playCollisionBeep();

        // Respawn vehicle on track
        car.episode += 1;
        car.step = 0;
        car.x = 400;
        car.y = 300;
        car.angle = 0;
        car.velocity = 1.0;
        car.totalReward = 0;
        car.epsilon = Math.max(0.05, car.epsilon * 0.99);
      } else {
        car.totalReward += 0.25 + (car.velocity * 0.08);
      }

      const updatedSnapshot = {
        episode: car.episode,
        step: car.step,
        total_reward: car.totalReward,
        avg_reward: car.totalReward / Math.max(1, car.step * 0.05),
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

      setTelemetry(updatedSnapshot);

      if (car.step % 25 === 0) {
        setRewardHistory(prev => [
          ...prev.slice(-300),
          { episode: car.episode, reward: car.totalReward, epsilon: car.epsilon }
        ]);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [simulationMode, isPaused, manualDriveActive, simSpeed, castRay]);

  // Keyboard Event Handlers for Manual Drive (W / A / S / D or Arrows)
  useEffect(() => {
    if (simulationMode !== 'browser' || !manualDriveActive) return;

    const handleKeyDown = (e) => {
      // Prevent key handling if typing in input fields
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const car = browserSimRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        car.velocity = Math.min(4.2, car.velocity + 0.35);
        car.lastAction = 'ACCELERATE';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        car.velocity = Math.max(-1.5, car.velocity - 0.45);
        car.lastAction = 'BRAKE';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        car.angle -= 9;
        car.steering = -0.3;
        car.lastAction = 'TURN_LEFT';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        car.angle += 9;
        car.steering = 0.3;
        car.lastAction = 'TURN_RIGHT';
      }
    };

    const handleKeyUp = () => {
      browserSimRef.current.steering = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [simulationMode, manualDriveActive]);

  // Reset vehicle position handler
  const handleResetVehicle = () => {
    const car = browserSimRef.current;
    car.x = 400;
    car.y = 300;
    car.angle = 0;
    car.velocity = 0;
    car.totalReward = 0;
    car.step = 0;
    setTelemetry(prev => ({
      ...prev,
      position: { x: 400, y: 300 },
      angle: 0,
      speed: 0
    }));
  };

  return (
    <DashboardRoot>
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Content Area */}
      <MainContentArea>
        {/* Top Navbar */}
        <TopNavbar
          simulationMode={simulationMode}
          setSimulationMode={setSimulationMode}
          manualDriveActive={manualDriveActive}
          setManualDriveActive={setManualDriveActive}
          wsConnected={wsConnected}
          cppEngineActive={cppEngineActive}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onOpenSettings={() => setCurrentView('settings')}
        />

        {/* Dynamic View Body */}
        <PageBody>
          {/* VIEW 1: Flagship Dashboard Cockpit */}
          {currentView === 'dashboard' && (
            <>
              {/* Top 6 Metric Cards */}
              <MetricCards
                telemetry={telemetry}
                rewardHistory={rewardHistory}
              />

              {/* Central 3D Simulation + Right Panels */}
              <SimulationRow>
                <Simulation3D
                  telemetry={telemetry}
                  isPaused={isPaused}
                  onTogglePause={() => setIsPaused(!isPaused)}
                  onResetEpisode={handleResetVehicle}
                  simSpeed={simSpeed}
                  onChangeSpeed={setSimSpeed}
                  manualDriveActive={manualDriveActive}
                />

                <RightPanelsColumn>
                  <VehicleView3D telemetry={telemetry} />
                  <SensorRadar sensors={telemetry?.sensors} />
                </RightPanelsColumn>
              </SimulationRow>

              {/* Bottom Analytics Row (3 Large Panels) */}
              <AnalyticsRow>
                <TrainingProgressChart rewardHistory={rewardHistory} />
                <QLearningHeatmap telemetry={telemetry} />
                <EpisodeStatistics telemetry={telemetry} />
              </AnalyticsRow>

              {/* Recent Episodes Strip */}
              <RecentEpisodes
                currentEpisode={telemetry?.episode ?? 61173}
                rewardHistory={rewardHistory}
              />
            </>
          )}

          {/* VIEW 2: 3D Simulation Full Environment */}
          {currentView === 'simulation' && (
            <SimulationView
              telemetry={telemetry}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              onResetEpisode={handleResetVehicle}
              simSpeed={simSpeed}
              onChangeSpeed={setSimSpeed}
              manualDriveActive={manualDriveActive}
            />
          )}

          {/* VIEW 3: Training Analytics */}
          {currentView === 'analytics' && (
            <AnalyticsView
              rewardHistory={rewardHistory}
              telemetry={telemetry}
            />
          )}

          {/* VIEW 4: Q-Learning Policy */}
          {currentView === 'qlearning' && (
            <QLearningView telemetry={telemetry} />
          )}

          {/* VIEW 5: Environment Geometry */}
          {currentView === 'environment' && (
            <EnvironmentView telemetry={telemetry} />
          )}

          {/* VIEW 6: Manual Control Drive Lab */}
          {currentView === 'manual' && (
            <ManualControlView
              telemetry={telemetry}
              manualDriveActive={manualDriveActive}
              setManualDriveActive={setManualDriveActive}
              onResetVehicle={handleResetVehicle}
              simulationMode={simulationMode}
              setSimulationMode={setSimulationMode}
            />
          )}

          {/* VIEW 7: Settings */}
          {currentView === 'settings' && (
            <SettingsView
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />
          )}

          {/* VIEW 8: About */}
          {currentView === 'about' && (
            <AboutView />
          )}
        </PageBody>
      </MainContentArea>
    </DashboardRoot>
  );
}
