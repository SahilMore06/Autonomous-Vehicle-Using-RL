import React from 'react';
import styled from 'styled-components';
import {
  Activity,
  Radio,
  Gamepad2,
  Zap,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';
import { THEME } from '../theme';

const NavbarContainer = styled.header`
  background: ${THEME.panelBg};
  border-bottom: 1px solid ${THEME.border};
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 30;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 16px;
  }
`;

const IdentityBlock = styled.div`
  display: flex;
  flex-direction: column;

  h1 {
    font-size: 1.05rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    margin: 0;
    letter-spacing: -0.2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 2px 0 0 0;
    font-size: 0.74rem;
    color: ${THEME.textSecondary};

    span.author {
      color: ${THEME.primary};
      font-weight: 600;
    }
  }
`;

const CenterModes = styled.div`
  display: flex;
  align-items: center;
  background: #06101F;
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 3px;
  gap: 2px;

  @media (max-width: 900px) {
    justify-content: space-between;
    overflow-x: auto;
  }
`;

const ModeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 6px;
  background: ${props => props.$active ? THEME.activeNavGrad : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(50, 133, 255, 0.45)' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : THEME.textSecondary};
  font-size: 0.78rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  box-shadow: ${props => props.$active ? THEME.glowPrimary : 'none'};

  svg {
    color: ${props => props.$active ? THEME.primary : THEME.textDim};
    flex-shrink: 0;
  }

  &:hover {
    color: #ffffff;
    background: ${props => props.$active ? THEME.activeNavGrad : 'rgba(18, 54, 83, 0.4)'};
  }
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    justify-content: space-between;
  }
`;

const StatusPill = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(6, 16, 31, 0.7);
  border: 1px solid ${props => props.$active ? 'rgba(0, 230, 184, 0.3)' : THEME.border};
  font-size: 0.74rem;
  font-weight: 600;
  color: ${props => props.$active ? THEME.success : THEME.textSecondary};

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$active ? THEME.success : THEME.textDim};
    box-shadow: ${props => props.$active ? THEME.glowSuccess : 'none'};
    animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};
  }

  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }
`;

const IconButton = styled.button`
  background: #06101F;
  border: 1px solid ${THEME.border};
  color: ${THEME.textSecondary};
  width: 34px;
  height: 34px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${THEME.panelBgAlt};
    border-color: ${THEME.borderHover};
    color: #ffffff;
  }
`;

const AuthorProfileBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  background: rgba(6, 16, 31, 0.6);
  border: 1px solid ${THEME.border};

  .avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #ffffff;
  }

  .meta {
    display: flex;
    flex-direction: column;

    .name {
      font-size: 0.74rem;
      font-weight: 600;
      color: ${THEME.textPrimary};
      line-height: 1.1;
    }

    .role {
      font-size: 0.62rem;
      color: ${THEME.primary};
      letter-spacing: 0.3px;
    }
  }

  @media (max-width: 1200px) {
    display: none;
  }
`;

export default function TopNavbar({
  simulationMode,
  setSimulationMode,
  manualDriveActive,
  setManualDriveActive,
  wsConnected,
  cppEngineActive,
  soundEnabled,
  setSoundEnabled,
  onOpenSettings
}) {
  return (
    <NavbarContainer>
      <IdentityBlock>
        <h1>Autonomous Vehicle Using Reinforcement Learning</h1>
        <p>
          Next-Gen Autonomous Cockpit & Telemetry • <span className="author">Developed by Sahil More</span>
        </p>
      </IdentityBlock>

      {/* 4 Mode Controls */}
      <CenterModes>
        <ModeButton
          $active={simulationMode === 'cpp'}
          onClick={() => {
            setSimulationMode('cpp');
            setManualDriveActive(false);
          }}
          title="Connect to native C++ SFML simulation engine"
        >
          <Radio size={14} />
          <span>Live Simulator</span>
        </ModeButton>

        <ModeButton
          $active={simulationMode === 'browser' && !manualDriveActive}
          onClick={() => {
            setSimulationMode('browser');
            setManualDriveActive(false);
          }}
          title="Run 60fps high-precision simulation directly in WebGL"
        >
          <Activity size={14} />
          <span>Browser Sim</span>
        </ModeButton>

        <ModeButton
          $active={simulationMode === 'browser' && manualDriveActive}
          onClick={() => {
            setSimulationMode('browser');
            setManualDriveActive(true);
          }}
          title="Take direct manual driving control with W / A / S / D"
        >
          <Gamepad2 size={14} />
          <span>Manual Drive</span>
        </ModeButton>

        <ModeButton
          $active={simulationMode === 'training'}
          onClick={() => {
            setSimulationMode('training');
            setManualDriveActive(false);
          }}
          title="High-speed autonomous Q-Learning training"
        >
          <Zap size={14} />
          <span>Training Mode</span>
        </ModeButton>
      </CenterModes>

      {/* Right Controls */}
      <RightControls>
        <StatusPill $active={wsConnected && (simulationMode === 'cpp' ? cppEngineActive : true)}>
          <div className="indicator" />
          <span>
            {!wsConnected
              ? 'Server Standby'
              : (simulationMode === 'cpp'
                ? (cppEngineActive ? 'C++ Engine Live' : 'C++ Engine Idle')
                : (manualDriveActive ? 'Manual Drive Active' : 'Browser Sim Active'))}
          </span>
        </StatusPill>

        <IconButton
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute Audio Alerts' : 'Enable Audio Alerts'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </IconButton>

        <IconButton
          onClick={onOpenSettings}
          title="Telemetry & Simulation Settings"
        >
          <Settings size={16} />
        </IconButton>

        <AuthorProfileBadge>
          <div className="avatar">SM</div>
          <div className="meta">
            <span className="name">Sahil More</span>
            <span className="role">Author & Lead Dev</span>
          </div>
        </AuthorProfileBadge>
      </RightControls>
    </NavbarContainer>
  );
}
