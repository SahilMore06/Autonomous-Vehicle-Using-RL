@echo off
echo Installing development tools for autonomous vehicle simulation...

REM Install Chocolatey (package manager for Windows)
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

REM Install tools via Chocolatey
choco install -y mingw cmake git nodejs python

REM Install SFML (will need manual setup)
echo.
echo SFML needs manual installation:
echo 1. Download from: https://www.sfml-dev.org/download.php
echo 2. Extract to C:\SFML
echo 3. Add C:\SFML\bin to PATH

REM Install Node.js packages globally
npm install -g create-react-app vite

echo.
echo Installation complete! Please restart your terminal.
pause