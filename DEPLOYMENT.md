# Deployment Guide — Autonomous Vehicle Using RL

Deploy the **Autonomous Vehicle Using RL** Dashboard and Telemetry backend to the cloud.

---

## 🌟 Architecture Overview

The system consists of two layers:
1. **Frontend / Telemetry Server** (`rl-dashboard-nextgen`):
   - Node.js Express server + WebSocket broadcast + React HUD Dashboard.
   - Easily deployable to any cloud platform (Railway, Render, Fly.io, Vercel, Heroku).
2. **C++ SFML Simulation Engine** (`autonomus/.../simulator`):
   - Runs locally or on a GPU/CPU compute instance.
   - Streams telemetry state (`state.json`) to the dashboard.
   - *Note*: If the C++ engine is offline, the dashboard automatically activates its high-performance in-browser simulation mode with manual keyboard driving!

---

## 🚀 Option 1: Railway.app (Recommended)

Railway is optimal for Node.js + WebSocket applications.

### Quick Steps:

1. **Push your project to GitHub** using `./push_to_github.sh`.
2. Visit [https://railway.app](https://railway.app) and sign in with GitHub.
3. Click **New Project** → **Deploy from GitHub repo**.
4. Select `Autonomous-Vehicle-Using-RL`.
5. Under Settings:
   - **Root Directory**: `rl-dashboard-nextgen`
   - **Build Command**: `cd client && npm install && npm run build && cd ..`
   - **Start Command**: `node server.js`
6. Click **Deploy**. Railway will provide a public HTTPS/WSS domain (e.g. `https://autonomous-vehicle-using-rl.up.railway.app`).

---

## 🌐 Option 2: Render.com

1. Sign in to [Render](https://render.com).
2. Click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Set configurations:
   - **Root Directory**: `rl-dashboard-nextgen`
   - **Environment**: Node
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server.js`
5. Click **Create Web Service**.

---

## 💻 Option 3: Local Network Hosting

To access the dashboard from a phone, tablet, or another laptop on the same local Wi-Fi:

1. Find your machine's local IP address:
   ```bash
   # On macOS
   ipconfig getifaddr en0
   ```
2. Start the project:
   ```bash
   ./start.sh
   ```
3. On any device connected to the same Wi-Fi, open:
   ```
   http://<YOUR_LOCAL_IP>:3000
   ```
