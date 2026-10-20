#!/bin/bash

# ==============================================================================
# Autonomous Vehicle Using RL - GitHub Push & Sync Script
# ==============================================================================

echo "======================================================================"
echo "🚀 Pushing 'Autonomous Vehicle Using RL' to GitHub"
echo "======================================================================"
echo ""

# Configuration defaults
DEFAULT_REPO_NAME="Autonomous-Vehicle-Using-RL"
DEFAULT_BRANCH="main"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📌 Initializing Git repository..."
    git init -b "$DEFAULT_BRANCH"
fi

# Ensure default branch is main
git branch -M "$DEFAULT_BRANCH"

# Check current git remote
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)

if [ -z "$CURRENT_REMOTE" ]; then
    echo "ℹ️  No git remote 'origin' configured yet."
    echo ""
    read -p "Enter your GitHub username (or press enter for manual instructions): " USERNAME
    if [ -n "$USERNAME" ]; then
        REMOTE_URL="https://github.com/$USERNAME/$DEFAULT_REPO_NAME.git"
        echo "🔗 Setting remote origin to: $REMOTE_URL"
        git remote add origin "$REMOTE_URL"
    else
        echo ""
        echo "To connect to GitHub manually:"
        echo "  git remote add origin https://github.com/<YOUR_USERNAME>/$DEFAULT_REPO_NAME.git"
        echo "  git push -u origin main"
        exit 0
    fi
else
    echo "✅ Remote origin is configured as: $CURRENT_REMOTE"
fi

# Stage and Commit
echo ""
echo "📦 Staging verified project files..."
git add -A

COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo 0)
if [ "$COMMIT_COUNT" -eq 0 ]; then
    echo "📝 Creating initial commit..."
    git commit -m "feat: Autonomous Vehicle Using RL - Initial release with Next-Gen Telemetry Dashboard & C++ Q-Learning Engine"
else
    git diff --cached --quiet || git commit -m "chore: polish Autonomous Vehicle Using RL codebase, next-gen dashboard & documentation"
fi

echo ""
echo "📤 Pushing to GitHub (origin/main)..."
git push -u origin "$DEFAULT_BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo "🎉 SUCCESS! Your repository is live on GitHub!"
    echo "======================================================================"
else
    echo ""
    echo "⚠️  Push requires authentication or repository creation on GitHub."
    echo "Please ensure you have created the empty repository on GitHub first:"
    echo "  https://github.com/new -> Name: $DEFAULT_REPO_NAME"
    echo ""
    echo "Then push using:"
    echo "  git push -u origin $DEFAULT_BRANCH"
fi
