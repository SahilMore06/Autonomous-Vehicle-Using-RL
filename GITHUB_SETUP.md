# GitHub Setup & Push Guide

This guide walks you through publishing **Autonomous Vehicle Using RL** to GitHub.

---

## 📌 Repository Details

- **Project Name**: Autonomous Vehicle Using RL
- **Suggested GitHub Repository**: `Autonomous-Vehicle-Using-RL`
- **Default Branch**: `main`
- **Visibility**: Public (Recommended)

---

## 🚀 Option 1: Automated 1-Click Push (Recommended)

Run the included automated helper script:

```bash
./push_to_github.sh
```

The script will:
1. Initialize Git on the `main` branch if not already present.
2. Prompt for your GitHub username and configure the remote URL.
3. Stage all verified project files according to `.gitignore` (safely ignoring heavy binaries).
4. Create a clean commit and push to your GitHub repository.

---

## 🛠️ Option 2: Manual Push via Command Line

### Step 1: Create an Empty Repository on GitHub
1. Open your browser and visit: **[https://github.com/new](https://github.com/new)**
2. Set **Repository name**: `Autonomous-Vehicle-Using-RL`
3. Description: `Autonomous Vehicle Simulation & Real-time Telemetry Dashboard using Reinforcement Learning (Q-Learning) + C++ SFML`
4. Choose **Public**
5. **Do NOT check** "Add a README file", "Add .gitignore", or "Choose a license" (the repository already contains these).
6. Click **Create repository**.

### Step 2: Initialize & Push from Terminal

Run the following commands from the project root directory:

```bash
# 1. Initialize git and switch to main branch
git init -b main

# 2. Add remote origin (replace YOUR_GITHUB_USERNAME with your GitHub account)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Autonomous-Vehicle-Using-RL.git

# 3. Stage all project files
git add -A

# 4. Commit files
git commit -m "feat: Autonomous Vehicle Using RL - Initial release with Next-Gen Telemetry Dashboard & C++ Q-Learning Engine"

# 5. Push to GitHub
git push -u origin main
```

---

## 🔑 GitHub Authentication Notes

When running `git push`, GitHub will ask for credentials:
- **Username**: Your GitHub username.
- **Password**: Use a **GitHub Personal Access Token (Classic)** instead of your account password:
  1. Visit: [https://github.com/settings/tokens](https://github.com/settings/tokens)
  2. Click **Generate new token (classic)**.
  3. Note: `repo-push-token`.
  4. Scope: check `repo` (Full control of private repositories).
  5. Click **Generate token** and copy it to use as your password.

---

## 📁 What Files Are Tracked?

The `.gitignore` has been pre-configured to ensure the repository remains fast, lightweight, and under GitHub size limits:

- ✅ C++ Simulator Source Code (`main.cpp`, `CMakeLists.txt`, `build.sh`, `run_simulator.sh`)
- ✅ Vehicle Sprites, City Track Textures & Obstacle Definitions
- ✅ Full Next-Gen React Dashboard (`server.js`, `App.js`, pre-built static bundle)
- ✅ Launcher scripts (`start.sh`, `run_project.command`, `push_to_github.sh`)
- ✅ Demonstration Video (`Project output.mp4`)
- ✅ GitHub Actions Automated CI (`.github/workflows/ci.yml`)
- 🚫 Excludes bulky Windows installer zips (`cmake.zip`, `git.exe`, `mingw.7z`, `sfml.zip`) to keep the repository ultra-clean.
