# 🚗 Autonomous Vehicle Using RL

<p align="center">
  <img src="https://img.shields.io/badge/C%2B%2B-17-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white" alt="C++17" />
  <img src="https://img.shields.io/badge/SFML-3.0%2B-8CC445?style=for-the-badge&logo=sfml&logoColor=white" alt="SFML" />
  <img src="https://img.shields.io/badge/Reinforcement%20Learning-Q--Learning-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="RL" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/WebSocket-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSocket" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>An end-to-end autonomous driving simulation platform powered by Reinforcement Learning (Q-Learning), multi-ray LiDAR perception, and an ultra-low-latency real-time telemetry HUD cockpit.</strong>
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Reinforcement Learning Formulation](#-reinforcement-learning-formulation)
  - [State Space Discretization](#1-state-space-discretization)
  - [Action Space](#2-action-space)
  - [Bellman Optimality Update](#3-bellman-optimality-update)
  - [Reward Shaping](#4-reward-shaping)
- [Dashboard & Telemetry Cockpit](#-dashboard--telemetry-cockpit)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [One-Click Quickstart](#one-click-quickstart)
  - [Manual Step-by-Step Setup](#manual-step-by-step-setup)
- [API & Telemetry Specification](#-api--telemetry-specification)
- [Demonstration & Output](#-demonstration--output)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [License & Contributing](#-license--contributing)

---

## 🌟 Overview

**Autonomous Vehicle Using RL** is a production-grade cyber-physical autonomous driving testbed. It pairs a **high-speed C++ SFML 2D physics and raycasting engine** with an **intelligent Q-Learning agent** and a **futuristic React + Node.js telemetry dashboard**.

The vehicle navigates complex track environments populated with urban obstacles, learning optimal path planning, collision avoidance, and speed regulation through continuous reinforcement learning without any hardcoded rule paths.

```
┌────────────────────────────────┐         ┌─────────────────────────────────┐
│   C++ SFML Simulator Engine    │         │      Next-Gen Web Cockpit       │
│  • Continuous Kinematics       │         │  • 2D Radar Canvas (60 FPS)     │
│  • 5-Ray LiDAR Raycasting      │         │  • Speedometer & Gyro Compass   │
│  • Collision Detection         │         │  • Q-Learning Matrix Inspector  │
│  • Q-Table Updates             │         │  • Real-time Reward Analytics   │
└───────────────┬────────────────┘         └────────────────┬────────────────┘
                │ Writes                                    ▲ WebSocket
                ▼ (state.json)                              │ (10Hz+)
        ┌───────────────┐                  ┌────────────────┴────────────────┐
        │  state.json   │ ───────────────► │    Node.js Express Bridge       │
        └───────────────┘   Rapid Polling  │  • WebSocket Server             │
                                           │  • REST APIs & Asset Delivery   │
                                           └─────────────────────────────────┘
```

---

## 🚀 Key Features

- **⚡ High-Performance C++ SFML Simulator**:
  - Continuous 2D kinematics with realistic steering geometry, friction damping, acceleration, and braking curves.
  - 5 laser LiDAR distance sensors ($0^\circ$, $\pm 45^\circ$, $\pm 90^\circ$) calculating raycast intersections against polygonal obstacles in real-time.
  - Native multi-platform support (Apple Silicon macOS, x86_64 Linux, and Windows).

- **🧠 Advanced Reinforcement Learning (Q-Learning)**:
  - 5-Dimensional sensory observation mapped to $4^5 = 1024$ discrete state buckets.
  - Dynamic $\epsilon$-greedy exploration-exploitation decay schedule.
  - Binary Q-Table serialization (`q_table.bin`) for instant model checkpoint saving and loading.

- **🛰️ Ultra-Low-Latency Telemetry Server**:
  - High-frequency Node.js backend polling and broadcasting vehicle metrics via WebSocket.
  - REST endpoints for track geometry, historical reward logs, and system health status.

- **🎛️ Cyberpunk HUD Cockpit Dashboard**:
  - Dark glassmorphism interface styled with HSL tailored neon accents and modern typography.
  - Interactive 2D radar canvas featuring car sprite rendering, LiDAR beam distance visualization, collision boundaries, and trajectory breadcrumb trails.
  - Live digital gauges: Speedometer, heading gyro compass, current action indicator, and policy entropy meter.
  - **Dual Simulation Engine**: Can receive live telemetry from the native C++ engine OR run standalone in-browser simulation with keyboard drive override (**WASD / Arrow Keys**) for instant web demonstrations!

---

## 🔬 Reinforcement Learning Formulation

### 1. State Space Discretization

The autonomous vehicle observes a 5-dimensional continuous vector:
$$\mathbf{s} = \begin{bmatrix} d_{\text{front}}, & d_{\text{left}}, & d_{\text{right}}, & v, & \theta_{\text{steering}} \end{bmatrix}^T$$

To maintain tabular tractability with high convergence speed, each variable is discretized into **4 distinct buckets (0 to 3)**:

| Feature | Range | Bucket 0 | Bucket 1 | Bucket 2 | Bucket 3 |
|---|---|---|---|---|---|
| **Front Sensor ($d_f$)** | $[0, 1]$ | $< 0.12$ *(Danger)* | $0.12 - 0.30$ *(Close)* | $0.30 - 0.60$ *(Medium)* | $> 0.60$ *(Safe)* |
| **Left Sensor ($d_l$)** | $[0, 1]$ | $< 0.12$ *(Danger)* | $0.12 - 0.30$ *(Close)* | $0.30 - 0.60$ *(Medium)* | $> 0.60$ *(Safe)* |
| **Right Sensor ($d_r$)** | $[0, 1]$ | $< 0.12$ *(Danger)* | $0.12 - 0.30$ *(Close)* | $0.30 - 0.60$ *(Medium)* | $> 0.60$ *(Safe)* |
| **Velocity ($v$)** | $[-1, 1]$ | $< -0.2$ *(Reverse)* | $-0.2 - 0.15$ *(Crawling)*| $0.15 - 0.50$ *(Cruising)*| $> 0.50$ *(Fast)* |
| **Steering ($\theta$)** | $[-1, 1]$ | $< 0.25$ *(Hard Left)*| $0.25 - 0.50$ *(Mid Left)* | $0.50 - 0.75$ *(Mid Right)*| $> 0.75$ *(Hard Right)*|

The discrete state index $I \in [0, 1023]$ is uniquely computed as:
$$I(s) = d_f \cdot 4^4 + d_l \cdot 4^3 + d_r \cdot 4^2 + v \cdot 4^1 + \theta \cdot 4^0$$

### 2. Action Space

The vehicle selects from 5 discrete control actions:
$$A = \{0: \text{DO\_NOTHING}, \; 1: \text{ACCELERATE}, \; 2: \text{BRAKE}, \; 3: \text{TURN\_LEFT}, \; 4: \text{TURN\_RIGHT}\}$$

### 3. Bellman Optimality Update

The agent optimizes its policy using off-policy Temporal Difference Q-Learning:
$$Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \alpha \left[ r_{t+1} + \gamma \max_{a' \in A} Q(s_{t+1}, a') - Q(s_t, a_t) \right]$$

- **Learning Rate ($\alpha$)**: $0.10$
- **Discount Factor ($\gamma$)**: $0.95$
- **Exploration Policy**: $\epsilon$-greedy with decay $\epsilon_{e+1} = \max(0.05, \epsilon_e \times 0.995)$

### 4. Reward Shaping

$$R = R_{\text{progress}} + R_{\text{speed}} + R_{\text{centering}} + R_{\text{collision}}$$

- **Forward Movement**: $+0.2$ per step for surviving without collision.
- **Speed Incentive**: $+0.1 \times v$ to encourage rapid transit rather than idle stagnation.
- **Collision Penalty**: $-10.0$ on wall or obstacle impact, immediately terminating the episode.
- **Offroad Penalty**: $-5.0$ if the vehicle crosses the outer boundary.

---

## 🎛️ Dashboard & Telemetry Cockpit

The web dashboard is organized into 5 dedicated mission control tabs:

1. **🛰️ Cockpit & Live HUD**:
   - Ultra-smooth 60 FPS Canvas rendering the city track, vehicle sprite, animated laser LiDAR beams, and obstacle bounding boxes.
   - Live speed, steering angle, heading gyro, and current action pill.
2. **🧠 Q-Learning Matrix**:
   - Real-time State Bucket Decoder displaying the active bucket breakdown and current state index.
   - Live action-value ($Q(s, a)$) bar chart highlighting the greedy policy recommendation.
3. **📈 Training Analytics**:
   - Area charts displaying episodic cumulative reward history and moving average convergence.
4. **🎮 Drive Lab**:
   - Toggle between **AI Autopilot** and **Manual Keyboard Drive** (**W / A / S / D** or **Arrow Keys**).
   - Simulation speed toggles ($1\times$, $2\times$, $5\times$ Turbo) and vehicle spawn reset.
5. **📋 Telemetry Console**:
   - Real-time terminal stream with color-coded event logging for action choices, collisions, and rewards.

---

## 📂 Project Directory Structure

```
autonomous-vehicle-rl-training-main/
├── autonomus/
│   └── autonomous-rl-vehicle/
│       └── simulator/
│           ├── CMakeLists.txt             # Cross-platform CMake configuration
│           ├── main.cpp                   # C++ SFML simulator & Q-learning engine
│           ├── assets/                    # Vehicle sprites & city road track textures
│           │   ├── car sprite.png
│           │   └── city.jpg
│           ├── collision_areas.txt        # Track obstacle polygon definitions
│           ├── state.json                 # Real-time telemetry interchange file
│           ├── q_table.bin                # Serialized Q-table binary checkpoint
│           ├── build.sh                   # Simulator build utility
│           └── run_simulator.sh           # Simulator runtime launcher
│
├── rl-dashboard-nextgen/                  # Full-Stack Web Telemetry Cockpit
│   ├── server.js                          # Express.js & WebSocket telemetry server
│   ├── package.json                       # Server configuration & dependencies
│   └── client/                            # React 18 frontend
│       ├── public/
│       │   ├── index.html                 # Cyberpunk HUD web entrypoint
│       │   └── simulator-assets/          # Local static textures & sprites
│       ├── src/
│       │   ├── App.js                     # Next-gen cockpit, canvas & tabs
│       │   ├── collisionData.js           # Parsed obstacle geometry
│       │   └── index.js                   # React root mount
│       └── build/                         # Pre-compiled production bundle
│
├── .github/
│   └── workflows/
│       └── ci.yml                         # GitHub Actions automated build & CI
├── run_project.command                    # macOS One-Click Double-Click Launcher
├── start.sh                               # Universal Linux/macOS Startup Script
├── push_to_github.sh                      # Automated GitHub Sync & Push Script
├── Project output.mp4                     # Video demonstration of vehicle training
├── GITHUB_SETUP.md                        # Step-by-step GitHub repository guide
├── DEPLOYMENT.md                          # Cloud deployment instructions
├── .gitignore                             # Clean repository filters (no binary bloat)
└── README.md                              # This documentation
```

---

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **C++ Compiler**: Clang (macOS Xcode Command Line Tools) or GCC (Linux) with **C++17** support.
- **CMake**: Version 3.16 or higher.
- **SFML 3.x**:
  - macOS: `brew install sfml cmake`
  - Ubuntu/Debian: `sudo apt-get install libsfml-dev cmake`
- **Node.js**: Version 18.0 or higher (includes `npm`).

---

### One-Click Quickstart

#### On macOS:
Simply double-click:
```bash
./run_project.command
```
*Or from your terminal:*
```bash
./start.sh
```

#### On Linux:
```bash
chmod +x start.sh
./start.sh
```

This script will automatically:
1. Verify and compile the C++ SFML simulator with the appropriate system SDKs.
2. Verify and install dashboard server dependencies.
3. Launch the C++ simulator engine.
4. Launch the telemetry WebSocket server on `http://localhost:3000`.
5. Automatically open the dashboard in your default web browser.

---

### Manual Step-by-Step Setup

If you prefer to run components in separate terminals:

#### Terminal 1: Build & Launch the C++ Simulator

```bash
cd autonomus/autonomous-rl-vehicle/simulator
./build.sh
./run_simulator.sh
```

#### Terminal 2: Start the Web Telemetry Dashboard

```bash
cd rl-dashboard-nextgen
npm install
node server.js
```

#### Terminal 3: Open the Cockpit
Visit **`http://localhost:3000`** in any modern web browser.

---

## 📡 API & Telemetry Specification

The Node.js backend serves both WebSocket telemetry and REST endpoints:

### REST API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | `GET` | Returns connection status, simulator active flag, and current episode. |
| `/api/state` | `GET` | Returns current vehicle state (position, velocity, sensors, action). |
| `/api/history` | `GET` | Returns rolling history of episodic rewards and step transitions. |
| `/api/collision-areas` | `GET` | Returns track obstacle bounding boxes `[{x, y, width, height}]`. |
| `/api/config` | `GET` | Returns system hyperparameters, state dimensions, and action spaces. |

### WebSocket Payload Format (`ws://localhost:3000`)

```json
{
  "type": "state_update",
  "data": {
    "episode": 55066,
    "step": 42,
    "total_reward": 8.4,
    "avg_reward": 0.2,
    "epsilon": 0.05,
    "position": { "x": 412.5, "y": 305.2 },
    "angle": 14.5,
    "speed": 2.1,
    "steering": 0.1,
    "sensors": {
      "front": 0.85,
      "left": 0.62,
      "right": 0.74,
      "front_left": 0.71,
      "front_right": 0.80
    },
    "collisions": 1,
    "last_action": "ACCELERATE",
    "window_width": 986,
    "window_height": 980
  },
  "isLive": true,
  "timestamp": "2026-10-20T14:30:00.000Z"
}
```

---

## 🎥 Demonstration & Output

A full demonstration video of the autonomous vehicle training process is included in this repository:
- **`Project output.mp4`** (2.3 MB)

You can play this video directly in your media player or review the real-time canvas replay inside the dashboard Drive Lab.

---

## 🛠️ Troubleshooting & FAQ

<details>
<summary><b>1. Simulator fails to link on macOS with tapi/SDK error</b></summary>

Make sure your CMake build specifies the active Xcode SDK:
```bash
cd autonomus/autonomous-rl-vehicle/simulator
rm -rf build/*
cmake -B build -S . -DCMAKE_OSX_SYSROOT="$(xcrun --sdk macosx --show-sdk-path)"
cmake --build build
```
*(The included `./build.sh` script automates this detection).*
</details>

<details>
<summary><b>2. Dashboard shows "BROWSER SIM ACTIVE" instead of "LIVE TELEMETRY"</b></summary>

This means the web dashboard is running, but the C++ simulator has not been started yet. You can still test driving directly in the browser! To connect real C++ telemetry, start `./run_simulator.sh`.
</details>

<details>
<summary><b>3. How do I reset the trained Q-Table?</b></summary>

Run the Python generator script to recreate a fresh Q-Table with initial epsilon exploration:
```bash
cd autonomus/autonomous-rl-vehicle/simulator
python3 generate_qtable.py
```
</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/sahil/Autonomous-Vehicle-Using-RL/issues).

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<p align="center">
  <sub>Built with ❤️ for Autonomous Systems & Reinforcement Learning Research.</sub>
</p>
