#!/bin/bash

# ==============================================================================
# Autonomous Vehicle Using RL - One-Click Launcher
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================================"
echo "🚗 Autonomous Vehicle Using RL — Launching System"
echo "======================================================================"
echo ""

# 1. Check & Build C++ Simulator if needed
SIM_DIR="$DIR/autonomus/autonomous-rl-vehicle/simulator"
BUILD_DIR="$SIM_DIR/build"
SIM_BIN="$BUILD_DIR/AutonomousVehicleSimulator"

if [ ! -f "$SIM_BIN" ]; then
    echo "⚙️  Building C++ SFML Simulator..."
    mkdir -p "$BUILD_DIR"
    cd "$SIM_DIR"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SDK_PATH="$(xcrun --sdk macosx --show-sdk-path 2>/dev/null)"
        if [ -n "$SDK_PATH" ]; then
            cmake -B build -S . -DCMAKE_OSX_SYSROOT="$SDK_PATH" && cmake --build build
        else
            cmake -B build -S . && cmake --build build
        fi
    else
        cmake -B build -S . && cmake --build build
    fi
fi

# 2. Check & Install Dashboard Dependencies if needed
DASH_DIR="$DIR/rl-dashboard-nextgen"
if [ ! -d "$DASH_DIR/node_modules" ]; then
    echo "📦 Installing Dashboard server dependencies..."
    cd "$DASH_DIR" && npm install
fi

# 3. Launch Simulator
echo "🚗 Starting C++ SFML Simulation Engine..."
cd "$SIM_DIR"
if [ -f "$SIM_BIN" ]; then
    "$SIM_BIN" &
    SIM_PID=$!
    echo "   ✓ Simulator running (PID: $SIM_PID)"
else
    echo "   ⚠️  Running in In-Browser Simulation mode"
fi

# 4. Launch Dashboard Backend Server
echo "🌐 Starting Telemetry & WebSocket Server..."
cd "$DASH_DIR"
node server.js &
DASH_PID=$!

# Wait for server to bind port
sleep 2

# 5. Open Dashboard in Browser
echo "🚀 Opening Dashboard Cockpit in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
else
    echo "Please navigate to: http://localhost:3000"
fi

echo ""
echo "======================================================================"
echo "✅ Autonomous Vehicle Using RL is now LIVE!"
echo "   • Dashboard URL: http://localhost:3000"
echo "   • Press Ctrl+C in this terminal to stop all processes"
echo "======================================================================"

cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    [ -n "$SIM_PID" ] && kill $SIM_PID 2>/dev/null
    [ -n "$DASH_PID" ] && kill $DASH_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
