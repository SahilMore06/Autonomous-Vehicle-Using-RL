#!/bin/bash

# Build Script for Autonomous Vehicle Simulator
# Supports macOS (Apple Silicon / Intel) and Linux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"

echo "=================================================="
echo "⚙️  Building Autonomous Vehicle Simulator"
echo "📁 Source directory: $SCRIPT_DIR"
echo "📁 Build directory:  $BUILD_DIR"
echo "=================================================="

mkdir -p "$BUILD_DIR"
cd "$SCRIPT_DIR"

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

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "You can now run the simulator using: ./run_simulator.sh"
else
    echo ""
    echo "❌ Build failed! Please ensure SFML 3.x is installed."
    exit 1
fi
