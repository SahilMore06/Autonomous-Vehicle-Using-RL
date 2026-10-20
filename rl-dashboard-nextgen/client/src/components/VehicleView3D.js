import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Box
} from 'lucide-react';
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
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ToolButton = styled.button`
  background: #06101F;
  border: 1px solid ${props => props.$active ? 'rgba(50, 133, 255, 0.5)' : THEME.border};
  color: ${props => props.$active ? '#ffffff' : THEME.textSecondary};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${THEME.panelBgAlt};
    border-color: ${THEME.borderHover};
    color: #ffffff;
  }
`;

const CanvasWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  background: #06101F;
`;

const ViewportCanvas = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`;

const OrientationOverlay = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: rgba(6, 16, 31, 0.85);
  backdrop-filter: blur(6px);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 6px 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.68rem;
  pointer-events: none;

  .item {
    display: flex;
    flex-direction: column;
    gap: 1px;

    .label {
      color: ${THEME.textDim};
      font-size: 0.60rem;
      text-transform: uppercase;
    }

    .val {
      font-weight: 600;
      color: ${THEME.textPrimary};
    }
  }
`;

export default function VehicleView3D({ telemetry = {} }) {
  const mountRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const materialsRef = useRef([]);
  const controlsRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06101F);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(6, 4, 7);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // Technical 3D Grid Floor
    const grid = new THREE.GridHelper(16, 16, 0x3285ff, 0x183653);
    grid.position.y = -0.01;
    scene.add(grid);

    // Lights
    const ambLight = new THREE.AmbientLight(0x0e2138, 2.0);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0x7dd3fc, 1.8);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 0.8);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    // Procedural Vehicle Model
    const carGroup = new THREE.Group();
    materialsRef.current = [];

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3285ff,
      roughness: 0.2,
      metalness: 0.85
    });
    materialsRef.current.push(bodyMat);
    const bodyGeo = new THREE.BoxGeometry(2.2, 0.7, 4.6);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.65;
    carGroup.add(bodyMesh);

    // Cabin
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x06101f,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    materialsRef.current.push(cabinMat);
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.6, 2.2);
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.25, -0.2);
    carGroup.add(cabinMesh);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
    materialsRef.current.push(wheelMat, rimMat);

    const wheelPositions = [
      [-1.15, 0.4, 1.4],
      [1.15, 0.4, 1.4],
      [-1.15, 0.4, -1.4],
      [1.15, 0.4, -1.4]
    ];

    wheelPositions.forEach(pos => {
      const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(...pos);
      carGroup.add(tire);
    });

    // Spoiler
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x183653, roughness: 0.4 });
    materialsRef.current.push(spoilerMat);
    const spoilerGeo = new THREE.BoxGeometry(2.4, 0.1, 0.7);
    const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoiler.position.set(0, 1.4, -2.2);
    carGroup.add(spoiler);

    scene.add(carGroup);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && controlsRef.current) {
        carGroup.rotation.y += 0.008;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate]);

  // Wireframe toggle effect
  useEffect(() => {
    materialsRef.current.forEach(mat => {
      if (mat) mat.wireframe = wireframe;
    });
  }, [wireframe]);

  const rawSpeed = Math.abs(telemetry?.speed ?? 0);
  const speedKmh = (rawSpeed * 18.5).toFixed(1);
  const headingDeg = (telemetry?.angle ?? 0).toFixed(1);
  const steeringRad = (telemetry?.steering ?? 0).toFixed(2);
  const currentAction = telemetry?.last_action || 'DO_NOTHING';

  return (
    <PanelContainer>
      <PanelHeader>
        <div className="title">
          <Box size={14} color={THEME.primary} />
          Vehicle View
        </div>
        <HeaderControls>
          <ToolButton
            $active={wireframe}
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Shader"
          >
            {wireframe ? 'Solid' : 'Wireframe'}
          </ToolButton>

          <ToolButton
            $active={autoRotate}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto Rotation"
          >
            Rotate
          </ToolButton>

          <ToolButton
            onClick={() => {
              if (controlsRef.current) controlsRef.current.reset();
            }}
            title="Reset Preview Camera"
          >
            <RotateCcw size={12} />
          </ToolButton>
        </HeaderControls>
      </PanelHeader>

      <CanvasWrapper>
        <ViewportCanvas ref={mountRef} />
        <OrientationOverlay>
          <div className="item">
            <span className="label">Yaw (θ)</span>
            <span className="val" style={{ color: THEME.primary }}>{headingDeg}°</span>
          </div>
          <div className="item">
            <span className="label">Speed</span>
            <span className="val">{speedKmh} <small>km/h</small></span>
          </div>
          <div className="item">
            <span className="label">Steer (δ)</span>
            <span className="val">{steeringRad}</span>
          </div>
          <div className="item">
            <span className="label">Action</span>
            <span className="val" style={{ color: THEME.success }}>{currentAction}</span>
          </div>
        </OrientationOverlay>
      </CanvasWrapper>
    </PanelContainer>
  );
}
