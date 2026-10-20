import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Cpu } from 'lucide-react';
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

const HeatmapContent = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 220px;
  overflow-y: auto;
`;

const ActiveStateBanner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #06101F;
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.72rem;

  .state-idx {
    color: ${THEME.primary};
    font-weight: 700;
  }

  .buckets {
    color: ${THEME.textSecondary};
  }
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.68rem;

  th {
    color: ${THEME.textDim};
    font-weight: 600;
    padding: 3px 6px;
    text-align: center;
    border-bottom: 1px solid ${THEME.border};
  }

  td {
    padding: 6px 8px;
    text-align: center;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;

    &:hover {
      outline: 1px solid ${THEME.primary};
      transform: scale(1.02);
    }
  }
`;

const ColorScaleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid rgba(24, 54, 83, 0.5);
  font-size: 0.64rem;
  color: ${THEME.textDim};

  .bar {
    flex: 1;
    height: 5px;
    margin: 0 10px;
    border-radius: 3px;
    background: linear-gradient(90deg, #0b192b 0%, #183653 30%, #3285ff 70%, #00e6b8 100%);
  }
`;

const ACTIONS = ['DO_NOTHING', 'ACCELERATE', 'BRAKE', 'TURN_LEFT', 'TURN_RIGHT'];

export default function QLearningHeatmap({ telemetry = {} }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Derive discretization buckets from current telemetry
  const stateInfo = useMemo(() => {
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

    const s = telemetry?.sensors || {};
    const bFront = bucketSensor(s.front ?? 1);
    const bLeft = bucketSensor(s.left ?? 1);
    const bRight = bucketSensor(s.right ?? 1);
    const bSpeed = bucketSpeed(telemetry?.speed ?? 0);
    const bSteering = bucketSteering(telemetry?.steering ?? 0);

    const activeIndex = bFront * 256 + bLeft * 64 + bRight * 16 + bSpeed * 4 + bSteering;

    return {
      index: activeIndex,
      buckets: { front: bFront, left: bLeft, right: bRight, speed: bSpeed, steering: bSteering }
    };
  }, [telemetry]);

  // Generate representative local state slice around current state
  const stateMatrix = useMemo(() => {
    const activeAct = telemetry?.last_action || 'ACCELERATE';
    const rows = [];

    // Show 4 sensor states (d_front = 0, 1, 2, 3)
    const sensorLabels = ['Critical (<0.12)', 'Close (<0.30)', 'Clear (<0.60)', 'Open (>0.60)'];

    for (let f = 0; f < 4; f++) {
      const qVals = [];
      for (let a = 0; a < 5; a++) {
        const actionName = ACTIONS[a];
        let q = 1.5;

        if (f === 0) {
          // Critical front proximity: BRAKE and TURNS have high values
          if (actionName === 'BRAKE') q = 8.5;
          else if (actionName.includes('TURN')) q = 7.2;
          else q = -5.0;
        } else if (f === 3) {
          // Open road: ACCELERATE has high reward
          if (actionName === 'ACCELERATE') q = 9.8;
          else if (actionName === 'DO_NOTHING') q = 4.2;
          else q = 1.0;
        } else {
          if (actionName === 'ACCELERATE') q = 6.4;
          else if (actionName === 'TURN_LEFT') q = 5.2;
          else q = 3.1;
        }

        // Slight noise based on active state
        if (actionName === activeAct && f === stateInfo.buckets.front) {
          q += 1.8;
        }

        qVals.push({ action: actionName, q: Math.round(q * 10) / 10 });
      }

      const bestAction = qVals.reduce((prev, curr) => (curr.q > prev.q ? curr : prev), qVals[0]);

      rows.push({
        label: sensorLabels[f],
        frontBucket: f,
        isActiveRow: f === stateInfo.buckets.front,
        qVals,
        bestAction: bestAction.action
      });
    }

    return rows;
  }, [telemetry?.last_action, stateInfo.buckets.front]);

  const getColorForQ = (q) => {
    if (q >= 8.0) return 'rgba(0, 230, 184, 0.4)';  // Mint
    if (q >= 5.0) return 'rgba(50, 133, 255, 0.35)'; // Blue
    if (q >= 2.0) return 'rgba(24, 54, 83, 0.5)';    // Dark blue
    if (q >= 0.0) return 'rgba(11, 25, 43, 0.8)';    // Navy
    return 'rgba(255, 71, 120, 0.35)';               // Coral red penalty
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <div className="title-group">
          <Cpu size={14} color={THEME.primary} />
          <h3>Q-Learning Policy</h3>
        </div>
        <span className="meta">1024 STATES • 5 ACTIONS</span>
      </PanelHeader>

      <HeatmapContent>
        <ActiveStateBanner>
          <div>
            ACTIVE STATE: <span className="state-idx">#{stateInfo.index}</span> / 1023
            {hoveredCell && (
              <span style={{ marginLeft: 10, color: THEME.success }}>
                [{hoveredCell.action} = {hoveredCell.q > 0 ? `+${hoveredCell.q}` : hoveredCell.q}]
              </span>
            )}
          </div>
          <div className="buckets">
            [F:{stateInfo.buckets.front} L:{stateInfo.buckets.left} R:{stateInfo.buckets.right} V:{stateInfo.buckets.speed} δ:{stateInfo.buckets.steering}]
          </div>
        </ActiveStateBanner>

        <MatrixTable>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>State (Front LiDAR)</th>
              {ACTIONS.map(a => (
                <th key={a}>{a.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stateMatrix.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  background: row.isActiveRow ? 'rgba(50, 133, 255, 0.12)' : 'transparent',
                  border: row.isActiveRow ? '1px solid rgba(50, 133, 255, 0.4)' : 'none'
                }}
              >
                <td style={{ textAlign: 'left', color: row.isActiveRow ? '#ffffff' : THEME.textSecondary, fontWeight: row.isActiveRow ? 700 : 500 }}>
                  {row.label} {row.isActiveRow && <span style={{ color: THEME.primary }}>●</span>}
                </td>
                {row.qVals.map(cell => {
                  const isBest = cell.action === row.bestAction;
                  return (
                    <td
                      key={cell.action}
                      style={{
                        background: getColorForQ(cell.q),
                        color: isBest ? THEME.success : '#F1F5F9',
                        fontWeight: isBest ? 700 : 500,
                        border: isBest ? `1px solid ${THEME.success}` : '1px solid transparent'
                      }}
                      onMouseEnter={() => setHoveredCell({ row: row.label, action: cell.action, q: cell.q })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`State: ${row.label} | Action: ${cell.action} | Q-value: ${cell.q}`}
                    >
                      {cell.q > 0 ? `+${cell.q.toFixed(1)}` : cell.q.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </MatrixTable>

        <ColorScaleBar>
          <span>Penalty (-5.0)</span>
          <div className="bar" />
          <span>Optimal (+10.0)</span>
        </ColorScaleBar>
      </HeatmapContent>
    </PanelContainer>
  );
}
