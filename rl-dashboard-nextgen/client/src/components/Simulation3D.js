import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  height: 490px;
  background: #06101F;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${THEME.border};
  box-shadow: ${THEME.cardShadow};

  @media (max-width: 1200px) {
    height: 420px;
  }

  @media (max-width: 768px) {
    height: 350px;
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
  background: rgba(11, 25, 43, 0.90);
  backdrop-filter: blur(8px);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 10;
  pointer-events: none;
  min-width: 175px;

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
  background: rgba(11, 25, 43, 0.90);
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
  width: 135px;
  height: 135px;
  background: rgba(6, 16, 31, 0.92);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);

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
  background: rgba(11, 25, 43, 0.90);
  backdrop-filter: blur(8px);
  border: 1px solid ${THEME.border};
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  background: rgba(11, 25, 43, 0.90);
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

  // Three.js instances
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const carGroupRef = useRef(null);
  const lidarLinesRef = useRef([]);
  const lidarHitsRef = useRef([]);

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

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06101F);
    scene.fog = new THREE.FogExp2(0x06101F, 0.0028);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);
    camera.position.set(0, 14, 24);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls (for 'orbit' mode)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 220;
    controls.enabled = false;
    controlsRef.current = controls;

    // 5. Environmental Lighting (Nighttime City Automotive Mood)
    const ambientLight = new THREE.AmbientLight(0x18283f, 1.8);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xa5f3fc, 1.5);
    moonLight.position.set(50, 100, 60);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 300;
    const d = 110;
    moonLight.shadow.camera.left = -d;
    moonLight.shadow.camera.right = d;
    moonLight.shadow.camera.top = d;
    moonLight.shadow.camera.bottom = -d;
    scene.add(moonLight);

    const blueRimLight = new THREE.DirectionalLight(0x3285ff, 0.8);
    blueRimLight.position.set(-60, 40, -60);
    scene.add(blueRimLight);

    // 6. Authentic City Track Ground Plane (Using /simulator-assets/city.jpg)
    const textureLoader = new THREE.TextureLoader();
    const cityTexture = textureLoader.load('/simulator-assets/city.jpg');
    cityTexture.colorSpace = THREE.SRGBColorSpace;

    // Dimension: 986 × 980 mapped at scale 0.22 => 216.92 × 215.6
    const groundGeo = new THREE.PlaneGeometry(216.92, 215.6);
    const groundMat = new THREE.MeshStandardMaterial({
      map: cityTexture,
      roughness: 0.55,
      metalness: 0.15
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, 0);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Dark exterior terrain surrounding city map
    const terrainGeo = new THREE.PlaneGeometry(600, 600);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x050c18,
      roughness: 0.95
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -0.05;
    scene.add(terrainMesh);

    // 7. Architectural 3D City Buildings & Curbs on top of map
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f1e33,
      roughness: 0.4,
      metalness: 0.5
    });
    const roofGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4
    });

    COLLISION_OBSTACLES.forEach((obs) => {
      // Map 2D simulator coordinates into 3D world space
      const ox = (obs.x - 493) * 0.22;
      const oz = (obs.y - 490) * 0.22;
      const ow = Math.max(2, obs.width * 0.22);
      const oh = Math.max(2, obs.height * 0.22);

      // Distinguish perimeter walls vs interior buildings
      const isPerimeter = obs.width > 800 || obs.height > 800;

      if (isPerimeter) {
        // Outer track boundary guardrail
        const wallGeo = new THREE.BoxGeometry(ow, 1.8, oh);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x183653, roughness: 0.8 });
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(ox + ow / 2, 0.9, oz + oh / 2);
        scene.add(wallMesh);
      } else {
        // Modern 3D building block
        const bHeight = 4.5;
        const bGeo = new THREE.BoxGeometry(ow, bHeight, oh);
        const bMesh = new THREE.Mesh(bGeo, buildingMat);
        bMesh.position.set(ox + ow / 2, bHeight / 2, oz + oh / 2);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        scene.add(bMesh);

        // Illuminated rooftop neon edge
        const roofGeo = new THREE.BoxGeometry(ow * 0.96, 0.2, oh * 0.96);
        const roofMesh = new THREE.Mesh(roofGeo, roofGlowMat);
        roofMesh.position.set(ox + ow / 2, bHeight + 0.1, oz + oh / 2);
        scene.add(roofMesh);
      }
    });

    // 8. Build High-Visibility, Striking Sports Car
    const carGroup = new THREE.Group();

    // High-contrast brilliant electric racing cyan/blue
    const carPaintMat = new THREE.MeshStandardMaterial({
      color: 0x00c8ff,       // Brilliant electric cyan-blue
      roughness: 0.15,
      metalness: 0.85
    });

    const whiteStripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.2
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0a1424,
      roughness: 0.6
    });

    // Main Car Body (Length: 5.6, Width: 2.8, Height: 1.0)
    const bodyGeo = new THREE.BoxGeometry(2.8, 0.9, 5.6);
    const bodyMesh = new THREE.Mesh(bodyGeo, carPaintMat);
    bodyMesh.position.y = 0.85;
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    // Bold White Center Racing Stripe
    const stripeGeo = new THREE.BoxGeometry(0.65, 0.92, 5.62);
    const stripeMesh = new THREE.Mesh(stripeGeo, whiteStripeMat);
    stripeMesh.position.y = 0.85;
    carGroup.add(stripeMesh);

    // Aerodynamic Cabin / Windshield (Gloss black glass)
    const cabinGlassMat = new THREE.MeshStandardMaterial({
      color: 0x06101f,
      roughness: 0.05,
      metalness: 0.95
    });
    const cabinGeo = new THREE.BoxGeometry(2.2, 0.75, 2.8);
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinGlassMat);
    cabinMesh.position.set(0, 1.55, -0.3);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // Front Splitter
    const splitterGeo = new THREE.BoxGeometry(2.9, 0.15, 1.0);
    const splitter = new THREE.Mesh(splitterGeo, darkTrimMat);
    splitter.position.set(0, 0.35, 2.7);
    carGroup.add(splitter);

    // Rear High-Downforce Spoiler
    const spoilerGeo = new THREE.BoxGeometry(3.0, 0.12, 0.9);
    const spoiler = new THREE.Mesh(spoilerGeo, darkTrimMat);
    spoiler.position.set(0, 1.8, -2.6);
    carGroup.add(spoiler);

    const strutGeo = new THREE.BoxGeometry(0.12, 0.5, 0.3);
    const strutL = new THREE.Mesh(strutGeo, darkTrimMat);
    strutL.position.set(-0.9, 1.5, -2.6);
    const strutR = new THREE.Mesh(strutGeo, darkTrimMat);
    strutR.position.set(0.9, 1.5, -2.6);
    carGroup.add(strutL);
    carGroup.add(strutR);

    // 4 Wide Alloy Wheels with Silver Rims
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.15 });
    const wheelPositions = [
      [-1.45, 0.5, 1.7],
      [1.45, 0.5, 1.7],
      [-1.45, 0.5, -1.7],
      [1.45, 0.5, -1.7]
    ];

    wheelPositions.forEach(pos => {
      const wGroup = new THREE.Group();
      const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.42, 16);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.43, 8);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      wGroup.position.set(...pos);
      carGroup.add(wGroup);
    });

    // Dual High-Intensity LED Headlights
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x7dd3fc,
      emissiveIntensity: 2.2
    });
    const hlGeo = new THREE.BoxGeometry(0.5, 0.2, 0.12);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(-0.95, 0.85, 2.8);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(0.95, 0.85, 2.8);
    carGroup.add(hlL);
    carGroup.add(hlR);

    // Forward Spotlights Illuminating the Road Surface
    const spotL = new THREE.SpotLight(0xa5f3fc, 4.0, 45, Math.PI / 5, 0.4, 1.2);
    spotL.position.set(-0.95, 0.85, 2.8);
    const spotTargetL = new THREE.Object3D();
    spotTargetL.position.set(-0.95, 0, 25);
    carGroup.add(spotTargetL);
    spotL.target = spotTargetL;
    carGroup.add(spotL);

    const spotR = new THREE.SpotLight(0xa5f3fc, 4.0, 45, Math.PI / 5, 0.4, 1.2);
    spotR.position.set(0.95, 0.85, 2.8);
    const spotTargetR = new THREE.Object3D();
    spotTargetR.position.set(0.95, 0, 25);
    carGroup.add(spotTargetR);
    spotR.target = spotTargetR;
    carGroup.add(spotR);

    // Rear Coral Red LED Taillights
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff4778,
      emissive: 0xff4778,
      emissiveIntensity: 2.0
    });
    const tlGeo = new THREE.BoxGeometry(0.65, 0.2, 0.12);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(-0.95, 0.9, -2.8);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(0.95, 0.9, -2.8);
    carGroup.add(tlL);
    carGroup.add(tlR);

    // Glowing Neon Chassis Underglow (Visible blue/cyan halo on road)
    const underglow = new THREE.PointLight(0x00d2ff, 3.0, 8);
    underglow.position.set(0, 0.25, 0);
    carGroup.add(underglow);

    // Optional: GLTF car model overlay if loaded
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/models/car.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.4, 1.4, 1.4);
      model.position.set(0, 0.2, 0);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Replace body mesh if model loaded
      bodyMesh.visible = false;
      stripeMesh.visible = false;
      carGroup.add(model);
    }, undefined, () => {
      // Procedural car remains 100% active
    });

    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // 9. 5-Channel LiDAR Beams (Line + Glowing Endpoint)
    const lines = [];
    const hits = [];

    for (let i = 0; i < 5; i++) {
      // Dynamic Line Geometry
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.8, 0),
        new THREE.Vector3(0, 0.8, 10)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00e6b8,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      lines.push(line);

      // Hitpoint Sphere
      const hitGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const hitMat = new THREE.MeshStandardMaterial({
        color: 0x00e6b8,
        emissive: 0x00e6b8,
        emissiveIntensity: 1.5
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      scene.add(hitMesh);
      hits.push(hitMesh);
    }

    lidarLinesRef.current = lines;
    lidarHitsRef.current = hits;

    // 10. Animation & Follow Camera Loop
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const t = telemetryRef.current;
      const currentCameraMode = cameraModeRef.current;

      if (carGroupRef.current && t) {
        // Map 2D simulator space (0..986, 0..980) into Three.js 3D space
        const targetX = ((t.position?.x ?? 400) - 493) * 0.22;
        const targetZ = ((t.position?.y ?? 300) - 490) * 0.22;
        // In 2D, angle 0 is +X axis; in Three.js Z is forward so targetAngle = -angleRad + PI/2
        const angleDeg = t.angle ?? 0;
        const targetAngle = -((angleDeg * Math.PI) / 180) + Math.PI / 2;

        // Smooth vehicle position lerping
        carGroupRef.current.position.x += (targetX - carGroupRef.current.position.x) * 0.35;
        carGroupRef.current.position.z += (targetZ - carGroupRef.current.position.z) * 0.35;
        carGroupRef.current.rotation.y = targetAngle;

        const carPos = carGroupRef.current.position;

        // Camera Modes
        if (currentCameraMode === 'follow') {
          controls.enabled = false;
          // Position follow camera directly behind car looking ahead
          const chaseDist = 14;
          const chaseHeight = 5.8;
          const camX = carPos.x - Math.sin(targetAngle) * chaseDist;
          const camZ = carPos.z - Math.cos(targetAngle) * chaseDist;

          camera.position.x += (camX - camera.position.x) * 0.15;
          camera.position.y += (chaseHeight - camera.position.y) * 0.15;
          camera.position.z += (camZ - camera.position.z) * 0.15;
          camera.lookAt(carPos.x, carPos.y + 1.2, carPos.z);
        } else if (currentCameraMode === 'top') {
          controls.enabled = false;
          // Overhead tactical eagle-eye view
          camera.position.set(carPos.x, 115, carPos.z + 0.1);
          camera.lookAt(carPos.x, 0, carPos.z);
        } else if (currentCameraMode === 'orbit') {
          controls.enabled = true;
          controls.target.set(carPos.x, carPos.y + 1, carPos.z);
          controls.update();
        }

        // Update 5 LiDAR Beams radiating from front bumper
        const sensors = t.sensors || {};
        const sensorKeys = ['front', 'front_left', 'front_right', 'left', 'right'];
        const rayAngles = [0, -Math.PI / 4, Math.PI / 4, -Math.PI / 2, Math.PI / 2];

        sensorKeys.forEach((key, idx) => {
          const sDist = sensors[key] ?? 1.0;
          const maxDist = 32.0;
          const beamLen = maxDist * sDist;
          const beamAngle = targetAngle + rayAngles[idx];

          // Bumper origin
          const startX = carPos.x + Math.sin(targetAngle) * 2.8;
          const startZ = carPos.z + Math.cos(targetAngle) * 2.8;

          // Hitpoint
          const endX = startX + Math.sin(beamAngle) * beamLen;
          const endZ = startZ + Math.cos(beamAngle) * beamLen;

          const line = lidarLinesRef.current[idx];
          const hit = lidarHitsRef.current[idx];

          if (line && hit) {
            // Update line vertices
            const posAttr = line.geometry.attributes.position;
            posAttr.setXYZ(0, startX, 0.8, startZ);
            posAttr.setXYZ(1, endX, 0.8, endZ);
            posAttr.needsUpdate = true;

            // Update hitpoint
            hit.position.set(endX, 0.8, endZ);

            // Proximity color tint
            let colorHex = 0x00e6b8; // neon mint
            if (sDist < 0.28) colorHex = 0xff4778; // collision red
            else if (sDist < 0.50) colorHex = 0xffc857; // warning amber

            line.material.color.setHex(colorHex);
            hit.material.color.setHex(colorHex);
            hit.material.emissive.setHex(colorHex);
          }
        });
      }

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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

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
    ctx.fillStyle = '#06101F';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#183653';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    const sx = width / 986;
    const sy = height / 980;

    // Obstacles
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    COLLISION_OBSTACLES.forEach(obs => {
      ctx.fillRect(obs.x * sx, obs.y * sy, obs.width * sx, obs.height * sy);
    });

    // Vehicle
    const vx = (telemetry?.position?.x ?? 400) * sx;
    const vy = (telemetry?.position?.y ?? 300) * sy;
    const vAngle = ((telemetry?.angle ?? 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(vAngle);

    ctx.fillStyle = '#00E6B8';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -3.5);
    ctx.lineTo(-4, 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [telemetry]);

  const sensors = telemetry?.sensors || {};

  return (
    <SimContainer>
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
          if (val < 0.28) valColor = THEME.danger;
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
        <canvas ref={minimapCanvasRef} width={135} height={135} />
      </MinimapWrapper>

      {/* Bottom Center Toolbar */}
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
