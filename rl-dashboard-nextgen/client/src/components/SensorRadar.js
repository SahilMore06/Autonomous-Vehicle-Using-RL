import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Radio, AlertCircle, ShieldCheck } from 'lucide-react';
import { THEME } from '../theme';

const RadarContainer = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${THEME.cardShadow};
`;

const RadarHeader = styled.div`
  padding: 10px 14px;
  border-bottom: 1px solid ${THEME.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 0.74rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-badge {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.66rem;
    color: ${props => props.$hasWarning ? THEME.danger : THEME.success};
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
`;

const CanvasWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 230px;
  background: #06101F;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RadarCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const SensorLegend = styled.div`
  padding: 8px 12px;
  border-top: 1px solid ${THEME.border};
  background: rgba(6, 16, 31, 0.6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.68rem;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${THEME.textSecondary};

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
  }
`;

export default function SensorRadar({ sensors = {} }) {
  const canvasRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const sensorsRef = useRef(sensors);
  sensorsRef.current = sensors;

  const sFront = sensors?.front ?? 1.0;
  const sFrontLeft = sensors?.front_left ?? 1.0;
  const sFrontRight = sensors?.front_right ?? 1.0;
  const sLeft = sensors?.left ?? 1.0;
  const sRight = sensors?.right ?? 1.0;

  const hasWarning = sFront < 0.28 || sFrontLeft < 0.25 || sFrontRight < 0.25 || sLeft < 0.20 || sRight < 0.20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.44;

      ctx.clearRect(0, 0, width, height);

      // Deep dark navy radar background
      ctx.fillStyle = '#06101F';
      ctx.fillRect(0, 0, width, height);

      // 1. Concentric Range Rings (25%, 50%, 75%, 100%)
      const ringPercents = [0.25, 0.5, 0.75, 1.0];
      const ringMeters = ['8m', '16m', '24m', '32m'];

      ringPercents.forEach((pct, idx) => {
        const r = maxR * pct;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(24, 54, 83, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Distance range label
        ctx.fillStyle = '#64748B';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(ringMeters[idx], cx + 4, cy - r + 11);
      });

      // 2. Radial Crosshairs & Angle Lines
      const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
      ctx.strokeStyle = 'rgba(24, 54, 83, 0.45)';
      ctx.lineWidth = 1;
      angles.forEach(a => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.stroke();
      });

      // 3. Animated Radar Sweep Beam (Rotating Phosphor Glow)
      const currentSweep = sweepAngleRef.current;
      const sweepTailAngle = 0.5;

      ctx.save();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      sweepGrad.addColorStop(0, 'rgba(50, 133, 255, 0.25)');
      sweepGrad.addColorStop(1, 'rgba(0, 230, 184, 0.15)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, currentSweep - sweepTailAngle, currentSweep);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Sharp sweep leading edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(currentSweep) * maxR, cy + Math.sin(currentSweep) * maxR);
      ctx.strokeStyle = 'rgba(0, 230, 184, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 4. Center Vehicle Glyph
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#3285FF';
      ctx.fillRect(-6, -10, 12, 20);

      // Windshield
      ctx.fillStyle = '#06101F';
      ctx.fillRect(-4, -6, 8, 7);

      // Heading indicator
      ctx.fillStyle = '#00E6B8';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-4, -10);
      ctx.lineTo(4, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 5. Plot 5 LiDAR Sensor Rays & Contact Blips
      // Radar top is forward (angle = -Math.PI / 2)
      const sensorDefs = [
        { key: 'front', angle: -Math.PI / 2, label: 'F' },
        { key: 'front_left', angle: -Math.PI / 2 - Math.PI / 4, label: 'FL' },
        { key: 'front_right', angle: -Math.PI / 2 + Math.PI / 4, label: 'FR' },
        { key: 'left', angle: -Math.PI, label: 'L' },
        { key: 'right', angle: 0, label: 'R' }
      ];

      const currentSensors = sensorsRef.current || {};

      sensorDefs.forEach(s => {
        const val = currentSensors[s.key] ?? 1.0;
        const distR = maxR * val;
        const bx = cx + Math.cos(s.angle) * distR;
        const by = cy + Math.sin(s.angle) * distR;

        let col = '#00E6B8'; // mint
        if (val < 0.25) col = '#FF4778'; // danger
        else if (val < 0.50) col = '#FFC857'; // warning

        // Ray dotted line from center to blip
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = col + '55';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing Blip
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.strokeStyle = col + '88';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Distance text
        ctx.fillStyle = '#F1F5F9';
        ctx.font = '10px JetBrains Mono';
        const textX = bx + Math.cos(s.angle) * 12;
        const textY = by + Math.sin(s.angle) * 12;
        ctx.fillText(`${(val * 32).toFixed(1)}m`, textX - 12, textY + 3);
      });
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <RadarContainer>
      <RadarHeader $hasWarning={hasWarning}>
        <div className="title">
          <Radio size={14} color={THEME.primary} />
          Sensor Radar Array
        </div>
        <div className="status-badge">
          {hasWarning ? (
            <>
              <AlertCircle size={12} color={THEME.danger} />
              Proximity Alert
            </>
          ) : (
            <>
              <ShieldCheck size={12} color={THEME.success} />
              Sector Clear
            </>
          )}
        </div>
      </RadarHeader>

      <CanvasWrapper>
        <RadarCanvas ref={canvasRef} width={280} height={230} />
      </CanvasWrapper>

      <SensorLegend>
        <div className="legend-item">
          <div className="dot" style={{ background: THEME.success }} />
          <span>Clear (&gt;16m)</span>
        </div>
        <div className="legend-item">
          <div className="dot" style={{ background: THEME.warning }} />
          <span>Caution (8-16m)</span>
        </div>
        <div className="legend-item">
          <div className="dot" style={{ background: THEME.danger }} />
          <span>Critical (&lt;8m)</span>
        </div>
      </SensorLegend>
    </RadarContainer>
  );
}
