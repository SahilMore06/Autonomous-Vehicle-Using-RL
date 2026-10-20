import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Layers } from 'lucide-react';
import { THEME } from '../../theme';
import { COLLISION_OBSTACLES } from '../../collisionData';

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

const CanvasCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${THEME.cardShadow};
`;

const ObstacleListCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow-y: auto;
  box-shadow: ${THEME.cardShadow};

  .title {
    font-size: 0.76rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid ${THEME.border};
    padding-bottom: 6px;
    display: flex;
    justify-content: space-between;
  }

  .obs-row {
    background: #06101F;
    border: 1px solid ${THEME.border};
    border-radius: 6px;
    padding: 8px 10px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.70rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .coord {
      color: ${THEME.primary};
    }
    .dim {
      color: ${THEME.textDim};
    }
  }
`;

export default function EnvironmentView({ telemetry = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.fillStyle = '#06101F';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#183653';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const sx = width / 986;
    const sy = height / 980;

    // Draw all collision barriers
    COLLISION_OBSTACLES.forEach((obs, idx) => {
      const ox = obs.x * sx;
      const oy = obs.y * sy;
      const ow = obs.width * sx;
      const oh = obs.height * sy;

      ctx.fillStyle = 'rgba(255, 71, 120, 0.2)';
      ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = 'rgba(255, 71, 120, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, ow, oh);

      ctx.fillStyle = '#FF4778';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`#${idx + 1}`, ox + 4, oy + 12);
    });

    // Draw active vehicle position
    const vx = (telemetry?.position?.x ?? 400) * sx;
    const vy = (telemetry?.position?.y ?? 300) * sy;

    ctx.beginPath();
    ctx.arc(vx, vy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#00E6B8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [telemetry]);

  return (
    <Container>
      <Header>
        <div className="title-group">
          <h2>
            <Layers size={18} color={THEME.primary} />
            Environment Geometry & Collision Map
          </h2>
          <p>Native 986 × 980 bounding space with mapped collision obstacles from collision_areas.txt</p>
        </div>
      </Header>

      <Grid>
        <CanvasCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: THEME.textPrimary }}>
              2D Obstacle Coordinate Space (986 × 980)
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.70rem', color: THEME.success }}>
              ● Vehicle at ({Math.round(telemetry?.position?.x ?? 400)}, {Math.round(telemetry?.position?.y ?? 300)})
            </span>
          </div>
          <div style={{ width: '100%', height: 440, borderRadius: 6, overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
            <canvas ref={canvasRef} width={800} height={440} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </CanvasCard>

        <ObstacleListCard>
          <div className="title">
            <span>Collision Zones</span>
            <span>{COLLISION_OBSTACLES.length} Areas</span>
          </div>
          {COLLISION_OBSTACLES.map((obs, idx) => (
            <div className="obs-row" key={idx}>
              <div>
                <span style={{ color: THEME.textSecondary, marginRight: 6 }}>#{idx + 1}</span>
                <span className="coord">[{obs.x}, {obs.y}]</span>
              </div>
              <div className="dim">{obs.width} × {obs.height} px</div>
            </div>
          ))}
        </ObstacleListCard>
      </Grid>
    </Container>
  );
}
