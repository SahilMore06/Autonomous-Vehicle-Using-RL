@echo off
echo Setting up development environment...

set PATH=%PATH%;C:\cmake\cmake-3.28.1-windows-x86_64\bin
set PATH=%PATH%;C:\SFML\SFML-2.6.1\bin

echo Environment configured for current session.
echo Run this script before development work.

echo Verifying installations:
python --version 2>nul && echo ✓ Python installed || echo ✗ Python not found
C:\cmake\cmake-3.28.1-windows-x86_64\bin\cmake --version 2>nul && echo ✓ CMake installed || echo ✗ CMake not found

echo.
echo To make PATH changes permanent, manually add these to system PATH:
echo - C:\cmake\cmake-3.28.1-windows-x86_64\bin
echo - C:\SFML\SFML-2.6.1\bin