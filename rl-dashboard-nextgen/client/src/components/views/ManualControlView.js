import React from 'react';
import styled from 'styled-components';
import { Gamepad2, RotateCcw } from 'lucide-react';
import { THEME } from '../../theme';
import Simulation3D from '../Simulation3D';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
`;

const Header = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-group {
    h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: ${THEME.textPrimary};
      display: flex;
      align-items: center;
      gap: 8px;
    }
    p {
      margin: 3px 0 0 0;
      font-size: 0.74rem;
      color: ${THEME.textSecondary};
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const ControlCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: ${THEME.cardShadow};

  .title {
    font-size: 0.76rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid ${THEME.border};
    padding-bottom: 6px;
  }
`;

const KeyCluster = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 10px 0;

  .row {
    display: flex;
    gap: 6px;
  }

  .key-cap {
    width: 44px;
    height: 44px;
    background: #06101F;
    border: 1px solid ${props => props.$pressed ? THEME.primary : THEME.border};
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.85rem;
    font-weight: 700;
    color: ${props => props.$pressed ? '#ffffff' : THEME.textPrimary};
    box-shadow: ${props => props.$pressed ? THEME.glowPrimary : 'none'};

    small {
      font-size: 0.55rem;
      color: ${THEME.textDim};
    }
  }
`;

const DriveActionButton = styled.button`
  background: ${props => props.$active ? THEME.buttonGrad : '#06101F'};
  border: 1px solid ${props => props.$active ? 'rgba(50, 133, 255, 0.5)' : THEME.border};
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${THEME.panelBgAlt};
  }
`;

export default function ManualControlView({
  telemetry = {},
  manualDriveActive,
  setManualDriveActive,
  onResetVehicle,
  simulationMode,
  setSimulationMode
}) {
  const rawSpeed = Math.abs(telemetry?.speed ?? 0);
  const speedKmh = (rawSpeed * 18.5).toFixed(1);
  const currentAction = telemetry?.last_action || 'DO_NOTHING';

  return (
    <Container>
      <Header>
        <div className="title-group">
          <h2>
            <Gamepad2 size={18} color={THEME.primary} />
            Manual Driving Simulator Cockpit
          </h2>
          <p>Direct vehicle manual control override with keyboard inputs (W/A/S/D or Arrow Keys)</p>
        </div>
      </Header>

      <Grid>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Simulation3D
            telemetry={telemetry}
            manualDriveActive={manualDriveActive}
          />
        </div>

        <ControlCard>
          <div className="title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Control Status & Override</span>
            <span style={{ color: THEME.primary, fontFamily: 'JetBrains Mono' }}>{speedKmh} km/h</span>
          </div>

          <DriveActionButton
            $active={manualDriveActive}
            onClick={() => {
              if (simulationMode !== 'browser') {
                setSimulationMode('browser');
              }
              setManualDriveActive(!manualDriveActive);
            }}
          >
            <Gamepad2 size={16} />
            <span>{manualDriveActive ? 'Manual Drive Active' : 'Enable Manual Driving'}</span>
          </DriveActionButton>

          <div style={{ fontSize: '0.74rem', color: THEME.textSecondary, lineHeight: 1.5 }}>
            {manualDriveActive
              ? 'Vehicle is accepting real-time manual keyboard steering and throttle. Autopilot Q-Learning updates are paused during manual drive.'
              : 'Autonomous Q-Learning policy currently controls vehicle trajectories and actions.'}
          </div>

          <div className="title" style={{ marginTop: 8 }}>Keyboard Keypad</div>
          <KeyCluster>
            <div className="key-cap" style={{ borderColor: currentAction === 'ACCELERATE' ? THEME.primary : THEME.border }}>
              W
              <small>ACCEL</small>
            </div>
            <div className="row">
              <div className="key-cap" style={{ borderColor: currentAction === 'TURN_LEFT' ? THEME.primary : THEME.border }}>
                A
                <small>LEFT</small>
              </div>
              <div className="key-cap" style={{ borderColor: currentAction === 'BRAKE' ? THEME.danger : THEME.border }}>
                S
                <small>BRAKE</small>
              </div>
              <div className="key-cap" style={{ borderColor: currentAction === 'TURN_RIGHT' ? THEME.primary : THEME.border }}>
                D
                <small>RIGHT</small>
              </div>
            </div>
          </KeyCluster>

          <DriveActionButton onClick={onResetVehicle} style={{ background: '#06101F' }}>
            <RotateCcw size={14} />
            <span>Reset Vehicle Spawn</span>
          </DriveActionButton>
        </ControlCard>
      </Grid>
    </Container>
  );
}
