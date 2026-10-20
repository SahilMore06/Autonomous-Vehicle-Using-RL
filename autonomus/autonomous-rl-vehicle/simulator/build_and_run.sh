#!/bin/bash

# Build and Run Script for Autonomous Vehicle Simulator

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
BINARY="$BUILD_DIR/AutonomousVehicleSimulator"

echo "================================"
echo "Autonomous Vehicle Simulator"
echo "================================"
echo ""

# Create build directory if needed
if [ ! -d "$BUILD_DIR" ]; then
    mkdir -p "$BUILD_DIR"
fi

# Build
echo "Step 1: Building simulator..."
cd "$BUILD_DIR"
cmake .. && make

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Step 2: Checking dependencies..."

# Check xvfb-run
if ! command -v xvfb-run &> /dev/null; then
    echo "Installing xvfb (virtual display)..."
    sudo apt-get install -y xvfb
fi

echo ""
echo "Step 3: Starting simulator..."
echo "Process will run in background. Check processes with: ps aux | grep AutonomousVehicleSimulator"
echo ""

# Run with virtual display in background
xvfb-run -a "$BINARY" &

PID=$!
echo "Simulator started with PID: $PID"
echo "Use 'kill $PID' to stop it."
