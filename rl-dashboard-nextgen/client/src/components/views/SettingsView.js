import React from 'react';
import styled from 'styled-components';
import { Settings as SettingsIcon, Sliders, Volume2, Shield } from 'lucide-react';
import { THEME } from '../../theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 900px;
`;

const Header = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 14px 20px;

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
`;

const Card = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: ${THEME.cardShadow};

  .section-title {
    font-size: 0.78rem;
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

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;

  .meta {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .name {
      color: ${THEME.textPrimary};
      font-weight: 600;
    }
    .desc {
      font-size: 0.70rem;
      color: ${THEME.textDim};
    }
  }
`;

const ToggleButton = styled.button`
  background: ${props => props.$active ? THEME.primary : '#06101F'};
  border: 1px solid ${props => props.$active ? THEME.primary : THEME.border};
  color: ${props => props.$active ? '#ffffff' : THEME.textSecondary};
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
  }
`;

export default function SettingsView({ soundEnabled, setSoundEnabled }) {
  return (
    <Container>
      <Header>
        <h2>
          <SettingsIcon size={18} color={THEME.primary} />
          System & Telemetry Settings
        </h2>
        <p>Configure telemetry sync frequency, WebGL graphics fidelity, and audio feedback</p>
      </Header>

      <Card>
        <div className="section-title">
          <Volume2 size={14} color={THEME.primary} />
          Audio & Feedback
        </div>
        <SettingRow>
          <div className="meta">
            <span className="name">Collision Audio Alerts</span>
            <span className="desc">Play synthesized Web Audio warning tones on track collisions</span>
          </div>
          <ToggleButton $active={soundEnabled} onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? 'Enabled' : 'Disabled'}
          </ToggleButton>
        </SettingRow>
      </Card>

      <Card>
        <div className="section-title">
          <Sliders size={14} color={THEME.secondary} />
          Three.js WebGL Rendering Quality
        </div>
        <SettingRow>
          <div className="meta">
            <span className="name">Shadow Maps & PBR Reflections</span>
            <span className="desc">Soft PCF shadows with dynamic asphalt reflections</span>
          </div>
          <ToggleButton $active={true}>High Fidelity</ToggleButton>
        </SettingRow>

        <SettingRow>
          <div className="meta">
            <span className="name">Target Render Frame Rate</span>
            <span className="desc">Display refresh sync with requestAnimationFrame</span>
          </div>
          <ToggleButton $active={true}>60 FPS</ToggleButton>
        </SettingRow>
      </Card>

      <Card>
        <div className="section-title">
          <Shield size={14} color={THEME.success} />
          Simulator Telemetry Stream
        </div>
        <SettingRow>
          <div className="meta">
            <span className="name">Telemetry Broadcast Frequency</span>
            <span className="desc">Node.js server state polling interval</span>
          </div>
          <ToggleButton $active={true}>10 Hz (100ms)</ToggleButton>
        </SettingRow>
      </Card>
    </Container>
  );
}
