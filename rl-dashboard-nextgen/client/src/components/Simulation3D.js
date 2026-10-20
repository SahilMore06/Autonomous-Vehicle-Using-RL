import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Camera,
  RotateCcw,
  Play,
  Pause,
  Eye,
  Sliders
} from 'lucide-react';
import { THEME } from '../theme';
import { COLLISION_OBSTACLES } from '../collisionData';

const SimContainer = styled.div`
  position: relative;
  width: 100%;
  height: 480px;
  background: #06101F;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${THEME.border};
  box-shadow: ${THEME.cardShadow};

  @media (max-width: 1200px) {
    height: 400px;
  }

  @media (max-width: 768px) {
    height: 340px;
  }
`;

const ThreeCanvas = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`;

// Top-Left LiDAR HUD
const LidarHud = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(11, 25, 43, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
  pointer-events: none;
  min-width: 170px;

  .title {
    font-size: 0.68rem;
    font-weight: 700;
    color: ${THEME.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1px solid rgba(24, 54, 83, 0.7);
    padding-bottom: 4px;
    display: flex;
    justify-content: space-between;
  }

  .sensor-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 0.72rem;

    .name {
      color: ${THEME.textDim};
    }

    .val {
      font-weight: 600;
    }
  }
`;

// Top-Right Camera Switcher
const CameraControls = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
`;

const ControlButton = styled.button`
  background: rgba(11, 25, 43, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid ${props => props.$active ? 'rgba(50, 133, 255, 0.55)' : THEME.border};
  color: ${props => props.$active ? '#ffffff' : THEME.textSecondary};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: ${props => props.$active ? THEME.glowPrimary : 'none'};

  &:hover {
    background: ${THEME.panelBgAlt};
    border-color: ${THEME.borderHover};
    color: #ffffff;
  }
`;

// Bottom-Left Track Minimap
const MinimapWrapper = styled.div`
  position: absolute;
  bottom: 14px;
  left: 14px;
  width: 130px;
  height: 130px;
  background: rgba(6, 16, 31, 0.90);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

// Bottom-Right Keyboard Controls Guide
const KeyGuide = styled.div`
  position: absolute;
  bottom: 14px;
  right: 14px;
  background: rgba(11, 25, 43, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10;
  font-size: 0.72rem;
  color: ${THEME.textSecondary};

  .key {
    background: #06101F;
    border: 1px solid ${THEME.border};
    border-radius: 4px;
    padding: 2px 6px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    color: ${THEME.primary};
    font-weight: 600;
    font-size: 0.68rem;
  }
`;

// Bottom Center Simulation Action Bar
const SimToolbar = styled.div`
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  background: rgba(11, 25, 43, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid ${THEME.border};
  border-radius: 8px;
  padding: 4px 8px;
`;

export default function Simulation3D({
  telemetry = {},
  isPaused,
  onTogglePause,
  onResetEpisode,
  simSpeed,
  onChangeSpeed,
  manualDriveActive
}) {
  const mountRef = useRef(null);
  const minimapCanvasRef = useRef(null);

  const [cameraMode, setCameraMode] = useState('follow'); // 'follow', 'top', 'orbit'

  // Three.js instances stored in refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const carGroupRef = useRef(null);
  const lidarRaysRef = useRef([]);
  const lidarHitsRef = useRef([]);

  // Telemetry reference for animation loop
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Cinematic Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06101F);
    scene.fog = new THREE.FogExp2(0x06101F, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);
    camera.position.set(0, 15, 30);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls (Enabled in 'orbit' mode)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 150;
    controls.enabled = false;
    controlsRef.current = controls;

    // 5. Environmental Lighting (Nighttime Automotive Atmosphere)
    const ambientLight = new THREE.AmbientLight(0x0c1b30, 1.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    moonLight.position.set(40, 80, 50);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 250;
    const d = 80;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    scene.add(moonLight);

    // Subtle blue fill light
    const fillLight = new THREE.DirectionalLight(0x3285ff, 0.4);
    fillLight.position.set(-50, 30, -50);
    scene.add(fillLight);

    // 6. Ground & Track Surface
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050c17,
      roughness: 0.9,
      metalness: 0.1
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Dark Asphalt Race Track Loop / Road
    const trackWidth = 14;
    const roadCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-100, 0, -60),
      new THREE.Vector3(0, 0, -80),
      new THREE.Vector3(100, 0, -60),
      new THREE.Vector3(120, 0, 0),
      new THREE.Vector3(100, 0, 60),
      new THREE.Vector3(0, 0, 80),
      new THREE.Vector3(-100, 0, 60),
      new THREE.Vector3(-120, 0, 0)
    ], true);

    const roadGeo = new THREE.TubeGeometry(roadCurve, 120, trackWidth / 2, 4, true);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x091424,
      roughness: 0.7,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.scale.set(1, 0.01, 1);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Road Markings (Dashed Centerline)
    const points = roadCurve.getPoints(80);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 3,
      gapSize: 2,
      linewidth: 2
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    line.position.y = 0.08;
    scene.add(line);

    // Neon Curbs / Borders
    const curbMat1 = new THREE.MeshStandardMaterial({ color: 0x3285ff, emissive: 0x3285ff, emissiveIntensity: 0.3 });
    const curbMat2 = new THREE.MeshStandardMaterial({ color: 0x00e6b8, emissive: 0x00e6b8, emissiveIntensity: 0.3 });

    for (let i = 0; i < points.length; i += 2) {
      const p = points[i];
      const curbBox = new THREE.BoxGeometry(2, 0.3, 1);
      const curbMesh = new THREE.Mesh(curbBox, i % 4 === 0 ? curbMat1 : curbMat2);
      curbMesh.position.set(p.x * 1.08, 0.15, p.z * 1.08);
      scene.add(curbMesh);
    }

    // 7. Track Obstacles & Barriers from Collision Data
    const obstacleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3
    });
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xff4778,
      emissive: 0xff4778,
      emissiveIntensity: 0.25
    });

    COLLISION_OBSTACLES.forEach((obs, idx) => {
      // Scale 2D simulator coords into 3D world coords
      const ox = (obs.x - 493) * 0.22;
      const oz = (obs.y - 490) * 0.22;
      const ow = Math.max(3, obs.width * 0.22);
      const oh = Math.max(3, obs.height * 0.22);

      const blockGeo = new THREE.BoxGeometry(ow, 3.5, oh);
      const blockMesh = new THREE.Mesh(blockGeo, obstacleMat);
      blockMesh.position.set(ox + ow / 2, 1.75, oz + oh / 2);
      blockMesh.castShadow = true;
      blockMesh.receiveShadow = true;
      scene.add(blockMesh);

      // Warning hazard stripe / border on top of obstacle
      const stripeGeo = new THREE.BoxGeometry(ow * 0.95, 0.4, oh * 0.95);
      const stripeMesh = new THREE.Mesh(stripeGeo, barrierMat);
      stripeMesh.position.set(ox + ow / 2, 3.5, oz + oh / 2);
      scene.add(stripeMesh);
    });

    // 8. Build Procedural High-Detail 3D Sports Car
    const carGroup = new THREE.Group();

    // Car Body / Chassis (Aerodynamic Sports Coupe)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3285ff,       // Electric Blue body
      roughness: 0.2,
      metalness: 0.85
    });
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.8, 5.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.7;
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    // Cabin / Windshield (Tinted glass)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x06101f,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88
    });
    const cabinGeo = new THREE.BoxGeometry(1.9, 0.65, 2.4);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 1.35, -0.3);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // Front Hood Slope & Splitter
    const splitterMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const splitterGeo = new THREE.BoxGeometry(2.5, 0.15, 1.2);
    const splitterMesh = new THREE.Mesh(splitterGeo, splitterMat);
    splitterMesh.position.set(0, 0.25, 2.4);
    carGroup.add(splitterMesh);

    // Rear Spoiler
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x183653, roughness: 0.4 });
    const spoilerGeo = new THREE.BoxGeometry(2.6, 0.1, 0.8);
    const spoilerMesh = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoilerMesh.position.set(0, 1.5, -2.4);
    carGroup.add(spoilerMesh);

    // Spoiler Struts
    const strutGeo = new THREE.BoxGeometry(0.12, 0.4, 0.3);
    const strutLeft = new THREE.Mesh(strutGeo, spoilerMat);
    strutLeft.position.set(-0.8, 1.25, -2.4);
    const strutRight = new THREE.Mesh(strutGeo, spoilerMat);
    strutRight.position.set(0.8, 1.25, -2.4);
    carGroup.add(strutLeft);
    carGroup.add(strutRight);

    // 4 Alloy Wheels with Rubber Tires
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
    const wheelPositions = [
      [-1.25, 0.45, 1.5],   // Front Left
      [1.25, 0.45, 1.5],    // Front Right
      [-1.25, 0.45, -1.5],  // Rear Left
      [1.25, 0.45, -1.5]    // Rear Right
    ];

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      const tireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.36, 8);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      wheelGroup.position.set(...pos);
      carGroup.add(wheelGroup);
    });

    // Dual LED Headlights with active Three.js Spotlight
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5
    });
    const hlGeo = new THREE.BoxGeometry(0.4, 0.18, 0.1);
    const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
    hlLeft.position.set(-0.8, 0.7, 2.5);
    const hlRight = new THREE.Mesh(hlGeo, headlightMat);
    hlRight.position.set(0.8, 0.7, 2.5);
    carGroup.add(hlLeft);
    carGroup.add(hlRight);

    // Spotlights casting light cones onto the dark road
    const spotLeft = new THREE.SpotLight(0x7dd3fc, 3.5, 35, Math.PI / 6, 0.4, 1.5);
    spotLeft.position.set(-0.8, 0.7, 2.5);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, 20);
    carGroup.add(spotTarget);
    spotLeft.target = spotTarget;
    carGroup.add(spotLeft);

    // Rear Coral Red Taillights
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff4778,
      emissive: 0xff4778,
      emissiveIntensity: 1.2
    });
    const tlGeo = new THREE.BoxGeometry(0.5, 0.15, 0.1);
    const tlLeft = new THREE.Mesh(tlGeo, taillightMat);
    tlLeft.position.set(-0.8, 0.75, -2.5);
    const tlRight = new THREE.Mesh(tlGeo, taillightMat);
    tlRight.position.set(0.8, 0.75, -2.5);
    carGroup.add(tlLeft);
    carGroup.add(tlRight);

    // Chassis Underglow (Soft electric blue neon on asphalt)
    const underglowLight = new THREE.PointLight(0x3285ff, 1.5, 5);
    underglowLight.position.set(0, 0.2, 0);
    carGroup.add(underglowLight);

    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // 9. 5-Channel LiDAR Beams
    const rays = [];
    const hits = [];
    const rayDirections = [
      0,               // Front
      -Math.PI / 4,    // Front-Left
      Math.PI / 4,     // Front-Right
      -Math.PI / 2,    // Left
      Math.PI / 2      // Right
    ];

    rayDirections.forEach(() => {
      // Beam cylinder
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x00e6b8,
        emissive: 0x00e6b8,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      scene.add(beamMesh);
      rays.push(beamMesh);

      // Glowing hitpoint sphere
      const hitGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const hitMat = new THREE.MeshStandardMaterial({
        color: 0x00e6b8,
        emissive: 0x00e6b8,
        emissiveIntensity: 1.2
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      scene.add(hitMesh);
      hits.push(hitMesh);
    });

    lidarRaysRef.current = rays;
    lidarHitsRef.current = hits;

    // 10. Animation Rendering Loop
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const t = telemetryRef.current;
      const currentCameraMode = cameraModeRef.current;

      // Update Car Position in 3D World Space
      if (carGroupRef.current && t) {
        // Map 2D simulator coordinates (0..986, 0..980) into Three.js 3D coordinates
        const targetX = ((t.position?.x ?? 400) - 493) * 0.22;
        const targetZ = ((t.position?.y ?? 300) - 490) * 0.22;
        // In 2D, angle is degrees from +X axis; in Three.js Z is forward, so we rotate around Y
        const targetAngle = -((t.angle ?? 0) * Math.PI) / 180 + Math.PI / 2;

        // Smooth vehicle position lerping
        carGroupRef.current.position.x += (targetX - carGroupRef.current.position.x) * 0.3;
        carGroupRef.current.position.z += (targetZ - carGroupRef.current.position.z) * 0.3;
        carGroupRef.current.rotation.y = targetAngle;

        const carPos = carGroupRef.current.position;

        // Camera Modes
        if (currentCameraMode === 'follow') {
          // Third-Person Chase Follow Camera
          controls.enabled = false;
          const chaseDist = 18;
          const chaseHeight = 8;
          const camX = carPos.x - Math.sin(targetAngle) * chaseDist;
          const camZ = carPos.z - Math.cos(targetAngle) * chaseDist;

          camera.position.x += (camX - camera.position.x) * 0.12;
          camera.position.y += (chaseHeight - camera.position.y) * 0.12;
          camera.position.z += (camZ - camera.position.z) * 0.12;
          camera.lookAt(carPos.x, carPos.y + 1.2, carPos.z);
        } else if (currentCameraMode === 'top') {
          // Top-Down Bird's-Eye View
          controls.enabled = false;
          camera.position.set(carPos.x, 70, carPos.z + 0.1);
          camera.lookAt(carPos.x, 0, carPos.z);
        } else if (currentCameraMode === 'orbit') {
          // User Orbit Controls
          controls.enabled = true;
          controls.target.set(carPos.x, carPos.y + 1, carPos.z);
          controls.update();
        }

        // Update 5-Channel LiDAR Beams in 3D
        const sensors = t.sensors || {};
        const sensorKeys = ['front', 'front_left', 'front_right', 'left', 'right'];
        const rayAngles = [0, -Math.PI / 4, Math.PI / 4, -Math.PI / 2, Math.PI / 2];

        sensorKeys.forEach((key, idx) => {
          const sDist = sensors[key] ?? 1.0;
          const maxBeamLen = 32.0;
          const beamLen = maxBeamLen * sDist;
          const beamAngle = targetAngle + rayAngles[idx];

          const startX = carPos.x + Math.sin(targetAngle) * 2.2;
          const startZ = carPos.z + Math.cos(targetAngle) * 2.2;

          const endX = startX + Math.sin(beamAngle) * beamLen;
          const endZ = startZ + Math.cos(beamAngle) * beamLen;

          const midX = (startX + endX) / 2;
          const midZ = (startZ + endZ) / 2;

          const rayMesh = lidarRaysRef.current[idx];
          const hitMesh = lidarHitsRef.current[idx];

          if (rayMesh && hitMesh) {
            rayMesh.position.set(midX, 0.7, midZ);
            rayMesh.scale.set(1, beamLen, 1);
            rayMesh.rotation.y = beamAngle;
            rayMesh.rotation.x = Math.PI / 2;

            hitMesh.position.set(endX, 0.7, endZ);

            // Dynamically tint beam based on proximity
            let colorHex = 0x00e6b8; // mint
            if (sDist < 0.25) colorHex = 0xff4778; // danger
            else if (sDist < 0.50) colorHex = 0xffc857; // warning

            rayMesh.material.color.setHex(colorHex);
            rayMesh.material.emissive.setHex(colorHex);
            hitMesh.material.color.setHex(colorHex);
            hitMesh.material.emissive.setHex(colorHex);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Window Resize Handler
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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update camera mode ref
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  // Minimap 2D Canvas Renderer
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // Minimap background
    ctx.fillStyle = '#06101F';
    ctx.fillRect(0, 0, width, height);

    // Track perimeter
    ctx.strokeStyle = '#183653';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    const sx = width / 986;
    const sy = height / 980;

    // Obstacles
    ctx.fillStyle = 'rgba(255, 71, 120, 0.4)';
    COLLISION_OBSTACLES.forEach(obs => {
      ctx.fillRect(obs.x * sx, obs.y * sy, obs.width * sx, obs.height * sy);
    });

    // Vehicle position blip
    const vx = (telemetry?.position?.x ?? 400) * sx;
    const vy = (telemetry?.position?.y ?? 300) * sy;
    const vAngle = ((telemetry?.angle ?? 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(vAngle);

    // Vehicle triangle
    ctx.fillStyle = '#00E6B8';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [telemetry]);

  const sensors = telemetry?.sensors || {};

  return (
    <SimContainer>
      {/* Three.js Container */}
      <ThreeCanvas ref={mountRef} />

      {/* Top-Left LiDAR HUD */}
      <LidarHud>
        <div className="title">
          <span>LiDAR 5-Ray Array</span>
          <span style={{ color: THEME.success }}>ACTIVE</span>
        </div>
        {[
          { key: 'front', label: 'Front' },
          { key: 'front_left', label: 'Front-L' },
          { key: 'front_right', label: 'Front-R' },
          { key: 'left', label: 'Left' },
          { key: 'right', label: 'Right' }
        ].map(s => {
          const val = sensors[s.key] ?? 1.0;
          let valColor = THEME.success;
          if (val < 0.25) valColor = THEME.danger;
          else if (val < 0.50) valColor = THEME.warning;

          return (
            <div className="sensor-row" key={s.key}>
              <span className="name">{s.label}:</span>
              <span className="val" style={{ color: valColor }}>
                {(val * 100).toFixed(0)}% <small style={{ color: THEME.textDim }}>({(val * 32).toFixed(1)}m)</small>
              </span>
            </div>
          );
        })}
      </LidarHud>

      {/* Top-Right Camera Controls */}
      <CameraControls>
        <ControlButton
          $active={cameraMode === 'follow'}
          onClick={() => setCameraMode('follow')}
        >
          <Camera size={13} />
          <span>3D Follow</span>
        </ControlButton>
        <ControlButton
          $active={cameraMode === 'top'}
          onClick={() => setCameraMode('top')}
        >
          <Eye size={13} />
          <span>Top View</span>
        </ControlButton>
        <ControlButton
          $active={cameraMode === 'orbit'}
          onClick={() => setCameraMode('orbit')}
        >
          <Sliders size={13} />
          <span>Orbit</span>
        </ControlButton>
        <ControlButton
          onClick={() => {
            setCameraMode('follow');
            if (controlsRef.current) controlsRef.current.reset();
          }}
          title="Reset Camera Position"
        >
          <RotateCcw size={13} />
        </ControlButton>
      </CameraControls>

      {/* Bottom-Left Minimap */}
      <MinimapWrapper>
        <canvas ref={minimapCanvasRef} width={130} height={130} />
      </MinimapWrapper>

      {/* Bottom Center Simulation Action Bar */}
      <SimToolbar>
        <ControlButton onClick={onTogglePause}>
          {isPaused ? <Play size={14} color={THEME.success} /> : <Pause size={14} color={THEME.warning} />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </ControlButton>

        <ControlButton onClick={onResetEpisode}>
          <RotateCcw size={14} />
          <span>Reset</span>
        </ControlButton>

        <ControlButton
          $active={simSpeed === 1}
          onClick={() => onChangeSpeed(1)}
        >
          1x
        </ControlButton>
        <ControlButton
          $active={simSpeed === 2}
          onClick={() => onChangeSpeed(2)}
        >
          2x
        </ControlButton>
        <ControlButton
          $active={simSpeed === 5}
          onClick={() => onChangeSpeed(5)}
        >
          5x
        </ControlButton>
      </SimToolbar>

      {/* Bottom-Right Keyboard Controls Guide */}
      <KeyGuide>
        <span>Manual Drive:</span>
        <span className="key">W</span>
        <span className="key">A</span>
        <span className="key">S</span>
        <span className="key">D</span>
      </KeyGuide>
    </SimContainer>
  );
}
