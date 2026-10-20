#!/bin/bash

# Autonomous Vehicle Simulator Launcher
# Cross-platform support for macOS and Linux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
BINARY="$BUILD_DIR/AutonomousVehicleSimulator"

if [ ! -f "$BINARY" ]; then
    echo "⚙️  Binary not found. Building simulator..."
    cd "$SCRIPT_DIR"
    ./build.sh
fi

if [ ! -f "$BINARY" ]; then
    echo "❌ Error: Simulator binary build failed."
    exit 1
fi

echo "🚗 Starting Autonomous Vehicle Simulator..."
echo "📁 Binary: $BINARY"
echo ""

cd "$SCRIPT_DIR"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # Native macOS execution
    "$BINARY"
elif [ -n "$DISPLAY" ]; then
    # Linux with active X11/Wayland display
    "$BINARY"
elif command -v xvfb-run &> /dev/null; then
    # Headless Linux with xvfb
    xvfb-run -a "$BINARY"
else
    echo "⚠️  No graphical display found. If running headless on Linux, please install xvfb."
    "$BINARY"
fi

echo "Simulator session ended."
