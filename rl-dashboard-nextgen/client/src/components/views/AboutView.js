import React from 'react';
import styled from 'styled-components';
import { Info, Code, Cpu, ExternalLink, Award } from 'lucide-react';
import { THEME } from '../../theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 960px;
`;

const Header = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 16px 22px;

  h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    margin: 4px 0 0 0;
    font-size: 0.78rem;
    color: ${THEME.textSecondary};

    span.author {
      color: ${THEME.primary};
      font-weight: 600;
    }
  }
`;

const ProfileCard = styled.div`
  background: linear-gradient(135deg, rgba(11, 25, 43, 0.9) 0%, rgba(14, 33, 56, 0.9) 100%);
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: ${THEME.cardShadow};

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-weight: 800;
    color: #ffffff;
    box-shadow: ${THEME.glowPrimary};
    flex-shrink: 0;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
    }
    .role {
      font-size: 0.78rem;
      color: ${THEME.primary};
      font-weight: 600;
    }
    .bio {
      font-size: 0.76rem;
      color: ${THEME.textSecondary};
      line-height: 1.5;
      margin-top: 4px;
    }
  }
`;

const TechStackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const TechCard = styled.div`
  background: ${THEME.panelBg};
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  h4 {
    margin: 0;
    font-size: 0.80rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    display: flex;
    align-items: center;
    gap: 6px;
  }

  p {
    margin: 0;
    font-size: 0.74rem;
    color: ${THEME.textSecondary};
    line-height: 1.5;
  }
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 6px;
  background: ${THEME.buttonGrad};
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  width: fit-content;
  box-shadow: ${THEME.glowPrimary};
  transition: all 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 24px rgba(50, 133, 255, 0.4);
  }
`;

export default function AboutView() {
  return (
    <Container>
      <Header>
        <h2>
          <Info size={20} color={THEME.primary} />
          Autonomous Vehicle Using Reinforcement Learning
        </h2>
        <p>
          Next-Generation Autonomous Vehicle Telemetry & 3D Simulation Platform • Developed by <span className="author">Sahil More</span>
        </p>
      </Header>

      <ProfileCard>
        <div className="avatar">SM</div>
        <div className="details">
          <div className="name">Sahil More</div>
          <div className="role">Author & Lead Systems Engineer</div>
          <div className="bio">
            Designer and developer of the Autonomous Vehicle Using Reinforcement Learning project. Focused on autonomous systems, reinforcement learning algorithms, real-time robotics telemetry, and high-performance WebGL 3D visualizations.
          </div>
        </div>
      </ProfileCard>

      <TechStackGrid>
        <TechCard>
          <h4>
            <Cpu size={15} color={THEME.primary} />
            Simulation Engine (C++ / SFML)
          </h4>
          <p>
            Custom high-performance 2D kinematics physics engine written in C++ with SFML graphics, 5-channel raycast LiDAR distance sensing, and collision bounding area checks.
          </p>
        </TechCard>

        <TechCard>
          <h4>
            <Award size={15} color={THEME.success} />
            Reinforcement Learning
          </h4>
          <p>
            Q-Learning off-policy Temporal Difference control with 1024 discrete state space buckets (4⁵) and 5 discrete action choices. Checkpointed after 61,000+ training episodes.
          </p>
        </TechCard>

        <TechCard>
          <h4>
            <Code size={15} color={THEME.secondary} />
            Full-Stack Telemetry Cockpit
          </h4>
          <p>
            Node.js / Express backend with low-latency WebSocket broadcasting, React 18 frontend, Three.js 60fps WebGL 3D scene, Recharts performance curves, and styled-components design system.
          </p>
        </TechCard>
      </TechStackGrid>

      <div style={{ marginTop: 8 }}>
        <LinkButton
          href="https://github.com/SahilMore06/Autonomous-Vehicle-Using-RL"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>View on GitHub Repository</span>
          <ExternalLink size={14} />
        </LinkButton>
      </div>
    </Container>
  );
}
