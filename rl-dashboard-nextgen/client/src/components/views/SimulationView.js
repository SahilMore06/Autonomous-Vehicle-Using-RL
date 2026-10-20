import React from 'react';
import styled from 'styled-components';
import { Box, Shield, Zap } from 'lucide-react';
import { THEME } from '../../theme';
import Simulation3D from '../Simulation3D';
import SensorRadar from '../SensorRadar';

const ViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
`;

const ViewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 14px 20px;

  .title-group {
    display: flex;
    flex-direction: column;

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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const TelemetrySidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${THEME.cardShadow};

  .card-title {
    font-size: 0.74rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid ${THEME.border};
    padding-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.76rem;

  .label {
    color: ${THEME.textSecondary};
  }

  .value {
    color: #ffffff;
    font-weight: 600;
  }
`;

export default function SimulationView({
  telemetry = {},
  isPaused,
  onTogglePause,
  onResetEpisode,
  simSpeed,
  onChangeSpeed,
  manualDriveActive
}) {
  const rawSpeed = Math.abs(telemetry?.speed ?? 0);
  const speedKmh = (rawSpeed * 18.5).toFixed(1);

  return (
    <ViewContainer>
      <ViewHeader>
        <div className="title-group">
          <h2>
            <Box size={18} color={THEME.primary} />
            3D Simulation & Telemetry Environment
          </h2>
          <p>Full-fidelity WebGL 3D driving scene with 5-channel LiDAR raycasting and dynamic physics</p>
        </div>
      </ViewHeader>

      <ContentGrid>
        {/* Main 3D Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Simulation3D
            telemetry={telemetry}
            isPaused={isPaused}
            onTogglePause={onTogglePause}
            onResetEpisode={onResetEpisode}
            simSpeed={simSpeed}
            onChangeSpeed={onChangeSpeed}
            manualDriveActive={manualDriveActive}
          />

          <InfoCard>
            <div className="card-title">
              <Shield size={14} color={THEME.success} />
              Simulated 5-Ray LiDAR Sensor Array Specifications
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {[
                { name: 'Front Beam', angle: '0°', range: '32m', weight: '256' },
                { name: 'Front-Left', angle: '-45°', range: '32m', weight: '64' },
                { name: 'Front-Right', angle: '+45°', range: '32m', weight: '16' },
                { name: 'Left Beam', angle: '-90°', range: '32m', weight: '4' },
                { name: 'Right Beam', angle: '+90°', range: '32m', weight: '1' }
              ].map(s => (
                <div key={s.name} style={{ background: '#06101F', padding: 8, borderRadius: 6, border: `1px solid ${THEME.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff' }}>{s.name}</div>
                  <div style={{ fontSize: '0.62rem', color: THEME.primary, marginTop: 2 }}>{s.angle} • {s.range}</div>
                  <div style={{ fontSize: '0.60rem', color: THEME.textDim, marginTop: 2 }}>Q-Weight: ×{s.weight}</div>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Telemetry Details Side Panel */}
        <TelemetrySidePanel>
          <SensorRadar sensors={telemetry?.sensors} />

          <InfoCard>
            <div className="card-title">
              <Zap size={14} color={THEME.primary} />
              Kinematics Telemetry
            </div>
            <MetricRow>
              <span className="label">Current Velocity:</span>
              <span className="value">{speedKmh} km/h</span>
            </MetricRow>
            <MetricRow>
              <span className="label">Vehicle Heading (θ):</span>
              <span className="value">{(telemetry?.angle ?? 0).toFixed(1)}°</span>
            </MetricRow>
            <MetricRow>
              <span className="label">Steering Angle (δ):</span>
              <span className="value">{(telemetry?.steering ?? 0).toFixed(2)} rad</span>
            </MetricRow>
            <MetricRow>
              <span className="label">Episode Step:</span>
              <span className="value">#{telemetry?.step ?? 0}</span>
            </MetricRow>
            <MetricRow>
              <span className="label">Current Reward:</span>
              <span className="value" style={{ color: (telemetry?.total_reward ?? 0) >= 0 ? THEME.success : THEME.danger }}>
                {(telemetry?.total_reward ?? 0).toFixed(1)}
              </span>
            </MetricRow>
            <MetricRow>
              <span className="label">Total Collisions:</span>
              <span className="value" style={{ color: (telemetry?.collisions ?? 0) > 0 ? THEME.danger : THEME.success }}>
                {telemetry?.collisions ?? 0}
              </span>
            </MetricRow>
          </InfoCard>
        </TelemetrySidePanel>
      </ContentGrid>
    </ViewContainer>
  );
}
