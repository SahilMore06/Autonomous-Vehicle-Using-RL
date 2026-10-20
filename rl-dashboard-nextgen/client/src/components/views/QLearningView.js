import React from 'react';
import styled from 'styled-components';
import { Cpu, BookOpen, Layers } from 'lucide-react';
import { THEME } from '../../theme';
import QLearningHeatmap from '../QLearningHeatmap';

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

const TheoryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TheoryCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: ${THEME.cardShadow};

  h3 {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  p {
    margin: 0;
    font-size: 0.76rem;
    color: ${THEME.textSecondary};
    line-height: 1.6;
  }

  .formula-box {
    background: #06101F;
    border: 1px solid ${THEME.border};
    border-radius: 6px;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.82rem;
    color: ${THEME.success};
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export default function QLearningView({ telemetry = {} }) {
  return (
    <Container>
      <Header>
        <div className="title-group">
          <h2>
            <Cpu size={18} color={THEME.primary} />
            Q-Learning Reinforcement Learning Architecture
          </h2>
          <p>Off-policy Temporal Difference Control with 1024 Discrete State Buckets & 5 Discrete Actions</p>
        </div>
      </Header>

      <TheoryGrid>
        <TheoryCard>
          <h3>
            <BookOpen size={14} color={THEME.primary} />
            Bellman Optimality Update Rule
          </h3>
          <p>
            The agent updates its state-action value table Q(s, a) using the Temporal Difference error between the immediate reward r plus discounted maximum expected future reward, and the current estimate:
          </p>
          <div className="formula-box">
            Q(s, a) ← Q(s, a) + α · [ r + γ · max Q(s', a') - Q(s, a) ]
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.72rem', color: THEME.textDim, fontFamily: 'JetBrains Mono' }}>
            <div>Learning Rate (α): 0.10</div>
            <div>Discount Factor (γ): 0.95</div>
            <div>Exploration (ε): 0.05-1.0</div>
          </div>
        </TheoryCard>

        <TheoryCard>
          <h3>
            <Layers size={14} color={THEME.secondary} />
            State Space Discretization (1024 States)
          </h3>
          <p>
            Continuous sensor inputs and kinematics are partitioned into 4 discrete levels each (0, 1, 2, 3) across 5 primary dimensions:
          </p>
          <div className="formula-box" style={{ color: THEME.primary, fontSize: '0.76rem' }}>
            Index s = (d_f · 256) + (d_l · 64) + (d_r · 16) + (v · 4) + δ
          </div>
          <p style={{ fontSize: '0.72rem' }}>
            Where d_f, d_l, d_r are Front, Left, and Right LiDAR proximity zones, v is vehicle velocity, and δ is steering angle.
          </p>
        </TheoryCard>
      </TheoryGrid>

      <QLearningHeatmap telemetry={telemetry} />
    </Container>
  );
}
