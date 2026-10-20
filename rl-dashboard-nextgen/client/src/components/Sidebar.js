import React from 'react';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Box,
  LineChart,
  Cpu,
  Layers,
  Gamepad2,
  Settings,
  Info,
  Car
} from 'lucide-react';
import { THEME } from '../theme';

const SidebarContainer = styled.aside`
  width: 240px;
  min-width: 240px;
  background: ${THEME.panelBg};
  border-right: 1px solid ${THEME.border};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 40;
  user-select: none;

  @media (max-width: 1024px) {
    width: 72px;
    min-width: 72px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarTop = styled.div`
  display: flex;
  flex-direction: column;
`;

const BrandHeader = styled.div`
  padding: 20px 18px;
  border-bottom: 1px solid ${THEME.border};
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 1024px) {
    padding: 16px 12px;
    justify-content: center;
  }
`;

const LogoIconBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: ${THEME.glowPrimary};
  flex-shrink: 0;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  h1 {
    font-size: 0.88rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    letter-spacing: -0.2px;
    margin: 0;
    line-height: 1.2;
    white-space: nowrap;
  }

  span {
    font-size: 0.68rem;
    font-weight: 600;
    color: ${THEME.primary};
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavList = styled.nav`
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  background: ${props => props.$active ? THEME.activeNavGrad : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(50, 133, 255, 0.45)' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : THEME.textSecondary};
  font-size: 0.82rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.18s ease-in-out;
  text-align: left;
  box-shadow: ${props => props.$active ? THEME.glowPrimary : 'none'};

  svg {
    color: ${props => props.$active ? THEME.primary : THEME.textDim};
    flex-shrink: 0;
    transition: color 0.18s ease;
  }

  &:hover {
    color: #ffffff;
    background: ${props => props.$active ? THEME.activeNavGrad : 'rgba(18, 54, 83, 0.45)'};
    border-color: ${props => props.$active ? 'rgba(50, 133, 255, 0.55)' : THEME.border};

    svg {
      color: ${THEME.primary};
    }
  }

  @media (max-width: 1024px) {
    padding: 12px;
    justify-content: center;

    span {
      display: none;
    }
  }
`;

const SidebarFooter = styled.div`
  padding: 16px 14px;
  border-top: 1px solid ${THEME.border};
  background: rgba(6, 16, 31, 0.5);

  @media (max-width: 1024px) {
    display: none;
  }
`;

const AuthorCard = styled.div`
  background: rgba(14, 33, 56, 0.65);
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .title {
    font-size: 0.76rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .author {
    font-size: 0.72rem;
    color: ${THEME.primary};
    font-weight: 600;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(50, 133, 255, 0.12);
    border: 1px solid rgba(50, 133, 255, 0.25);
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.64rem;
    color: ${THEME.textSecondary};
    margin-top: 2px;
  }
`;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'simulation', label: '3D Simulation', icon: Box },
  { id: 'analytics', label: 'Training Analytics', icon: LineChart },
  { id: 'qlearning', label: 'Q-Learning', icon: Cpu },
  { id: 'environment', label: 'Environment', icon: Layers },
  { id: 'manual', label: 'Manual Control', icon: Gamepad2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info }
];

export default function Sidebar({ currentView, onViewChange }) {
  return (
    <SidebarContainer>
      <SidebarTop>
        <BrandHeader>
          <LogoIconBox>
            <Car size={20} />
          </LogoIconBox>
          <BrandText>
            <h1>Autonomous Vehicle</h1>
            <span>RL Telemetry • 3D</span>
          </BrandText>
        </BrandHeader>

        <NavList>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <NavItem
                key={item.id}
                $active={isActive}
                onClick={() => onViewChange(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavItem>
            );
          })}
        </NavList>
      </SidebarTop>

      <SidebarFooter>
        <AuthorCard>
          <div className="title">
            <Car size={13} color={THEME.primary} />
            Autonomous Vehicle Using RL
          </div>
          <div className="author">Developed by Sahil More</div>
          <div className="badge">Q-Learning • Five-Ray LiDAR</div>
        </AuthorCard>
      </SidebarFooter>
    </SidebarContainer>
  );
}
