import React from 'react';
import styled from 'styled-components';
import { LineChart as ChartIcon, Award, Zap } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { THEME } from '../../theme';
import TrainingProgressChart from '../TrainingProgressChart';
import EpisodeStatistics from '../EpisodeStatistics';

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

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const AnalyticsCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${THEME.cardShadow};

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${THEME.border};
    padding-bottom: 8px;

    h3 {
      margin: 0;
      font-size: 0.78rem;
      font-weight: 700;
      color: ${THEME.textPrimary};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    span.badge {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 0.66rem;
      color: ${THEME.primary};
    }
  }
`;

export default function AnalyticsView({ rewardHistory = [], telemetry = {} }) {
  // Generate sample epsilon decay curve
  const epsilonData = React.useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 60; i += 5) {
      const ep = i * 1000;
      const eps = Math.max(0.05, 1.0 * Math.pow(0.9995, ep));
      pts.push({ episode: `${i}k`, epsilon: Math.round(eps * 1000) / 1000 });
    }
    return pts;
  }, []);

  // Reward distribution buckets
  const distributionData = [
    { range: '< 0', count: 14 },
    { range: '0-100', count: 28 },
    { range: '100-250', count: 85 },
    { range: '250-400', count: 210 },
    { range: '400-500', count: 480 },
    { range: '> 500', count: 320 }
  ];

  return (
    <Container>
      <Header>
        <div className="title-group">
          <h2>
            <ChartIcon size={18} color={THEME.primary} />
            Training Analytics & Convergence Evaluation
          </h2>
          <p>Reinforcement learning telemetry, Bellman policy evaluation, and exploration decay metrics</p>
        </div>
      </Header>

      <EpisodeStatistics telemetry={telemetry} />

      <TrainingProgressChart rewardHistory={rewardHistory} />

      <GridRow>
        {/* Epsilon Decay */}
        <AnalyticsCard>
          <div className="card-header">
            <h3>
              <Zap size={14} color={THEME.warning} />
              Exploration (ε) Decay Schedule
            </h3>
            <span className="badge">MIN ε = 0.05</span>
          </div>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={epsilonData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#183653" vertical={false} />
                <XAxis dataKey="episode" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0B192B', border: `1px solid ${THEME.border}` }} />
                <Line type="monotone" dataKey="epsilon" stroke={THEME.warning} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* Reward Distribution */}
        <AnalyticsCard>
          <div className="card-header">
            <h3>
              <Award size={14} color={THEME.success} />
              Reward Distribution Histogram
            </h3>
            <span className="badge">NORMALIZED BINS</span>
          </div>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#183653" vertical={false} />
                <XAxis dataKey="range" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0B192B', border: `1px solid ${THEME.border}` }} />
                <Bar dataKey="count" fill={THEME.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </GridRow>
    </Container>
  );
}
