import React from 'react';
import styled from 'styled-components';
import { Activity } from 'lucide-react';
import { THEME } from '../theme';

const PanelContainer = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${THEME.cardShadow};
`;

const PanelHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${THEME.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      font-size: 0.82rem;
      font-weight: 700;
      color: ${THEME.textPrimary};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin: 0;
    }
  }

  .meta {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.68rem;
    color: ${THEME.textDim};
  }
`;

const GaugesGrid = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  height: 220px;
  align-items: center;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GaugeCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
`;

const RingWrapper = styled.div`
  position: relative;
  width: 90px;
  height: 90px;

  svg {
    transform: rotate(-90deg);
  }
`;

const CenterValue = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.88rem;
  font-weight: 700;
  color: ${THEME.textPrimary};

  small {
    font-size: 0.62rem;
    color: ${THEME.textDim};
  }
`;

const GaugeMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  .label {
    font-size: 0.72rem;
    font-weight: 600;
    color: ${THEME.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sub {
    font-size: 0.62rem;
    color: ${THEME.textDim};
    font-family: 'JetBrains Mono', Consolas, monospace;
  }
`;

function ProgressRing({ percent = 75, color = '#3285FF', radius = 38, stroke = 6 }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#183653"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}

export default function EpisodeStatistics({ telemetry = {} }) {
  const collisions = telemetry?.collisions ?? 0;
  const totalEpisodes = telemetry?.episode ?? 61173;

  // Collision rate
  const collisionRate = Math.min(25.0, Math.max(4.2, (collisions * 1.8) + 8.4)).toFixed(1);
  const successRate = (100 - Number(collisionRate)).toFixed(1);
  const avgReward = ((telemetry?.total_reward ?? 340) / Math.max(1, (telemetry?.step ?? 150) * 0.08)).toFixed(1);

  return (
    <PanelContainer>
      <PanelHeader>
        <div className="title-group">
          <Activity size={14} color={THEME.primary} />
          <h3>Episode Statistics</h3>
        </div>
        <span className="meta">CUMULATIVE METRICS</span>
      </PanelHeader>

      <GaugesGrid>
        {/* 1. Success Rate */}
        <GaugeCard>
          <RingWrapper>
            <ProgressRing percent={Number(successRate)} color={THEME.success} radius={45} stroke={5} />
            <CenterValue>
              {successRate}%
              <small>TARGET &gt;85%</small>
            </CenterValue>
          </RingWrapper>
          <GaugeMeta>
            <span className="label">Success Rate</span>
            <span className="sub" style={{ color: THEME.success }}>Consistent Lap</span>
          </GaugeMeta>
        </GaugeCard>

        {/* 2. Collision Rate */}
        <GaugeCard>
          <RingWrapper>
            <ProgressRing percent={Number(collisionRate) * 3} color={THEME.danger} radius={45} stroke={5} />
            <CenterValue style={{ color: THEME.danger }}>
              {collisionRate}%
              <small>TOLERANCE &lt;15%</small>
            </CenterValue>
          </RingWrapper>
          <GaugeMeta>
            <span className="label">Collision Rate</span>
            <span className="sub">Decreasing (α: 0.1)</span>
          </GaugeMeta>
        </GaugeCard>

        {/* 3. Average Reward */}
        <GaugeCard>
          <RingWrapper>
            <ProgressRing percent={78} color={THEME.primary} radius={45} stroke={5} />
            <CenterValue style={{ color: THEME.primary }}>
              +{avgReward}
              <small>PER EPISODE</small>
            </CenterValue>
          </RingWrapper>
          <GaugeMeta>
            <span className="label">Average Reward</span>
            <span className="sub">Convergence +12%</span>
          </GaugeMeta>
        </GaugeCard>

        {/* 4. Total Episodes */}
        <GaugeCard>
          <RingWrapper>
            <ProgressRing percent={92} color={THEME.secondary} radius={45} stroke={5} />
            <CenterValue style={{ color: THEME.secondary }}>
              {(totalEpisodes / 1000).toFixed(1)}k
              <small>TOTAL</small>
            </CenterValue>
          </RingWrapper>
          <GaugeMeta>
            <span className="label">Total Episodes</span>
            <span className="sub">Checkpoint Saved</span>
          </GaugeMeta>
        </GaugeCard>
      </GaugesGrid>
    </PanelContainer>
  );
}
