#!/bin/bash

# ==============================================================================
# Autonomous Vehicle Using RL - Deployment Script
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Autonomous Vehicle Using RL — Deployment Utility          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_menu() {
    echo -e "${BLUE}Choose your deployment platform:${NC}"
    echo ""
    echo "  1) Railway.app (Recommended)"
    echo "  2) Render.com"
    echo "  3) View Deployment Documentation"
    echo "  4) Exit"
    echo ""
}

deploy_railway() {
    echo -e "${YELLOW}Deploying to Railway...${NC}"
    echo ""
    echo "1. Push repository to GitHub using: ./push_to_github.sh"
    echo "2. Visit https://railway.app and click 'New Project'"
    echo "3. Select 'Deploy from GitHub repo' -> Autonomous-Vehicle-Using-RL"
    echo "4. Set Root Directory to: rl-dashboard-nextgen"
    echo "5. Click Deploy!"
}

deploy_render() {
    echo -e "${YELLOW}Deploying to Render...${NC}"
    echo ""
    echo "1. Visit https://render.com"
    echo "2. Create a new Web Service connected to Autonomous-Vehicle-Using-RL"
    echo "3. Root directory: rl-dashboard-nextgen"
    echo "4. Build command: npm install && cd client && npm install && npm run build"
    echo "5. Start command: node server.js"
}

show_menu
read -p "Select an option [1-4]: " choice

case $choice in
    1) deploy_railway ;;
    2) deploy_render ;;
    3) cat DEPLOYMENT.md ;;
    4) exit 0 ;;
    *) echo "Invalid option." ;;
esac
