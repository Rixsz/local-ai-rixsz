@echo off
setlocal
title Local AI Web Launcher

echo ==========================================
echo 🚀 Launching Local AI Web...
echo ==========================================

cd /d "%~dp0"

REM --- CHECK DEPENDENCIES ---
if not exist "node_modules\" (
    echo 📦 node_modules not found. Running npm install...
    call npm install
)

REM --- CHECK OLLAMA ---
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Warning: Ollama is not detected!
    echo Please make sure Ollama is running.
    echo.
)

REM --- START BACKEND SERVER ---
echo 🛡️  Starting Backend Intelligence Server...
start /b python server.py > server.log 2>&1

REM --- START ELECTRON UI ---
echo 🖥️  Opening UI...
npx electron .

REM --- CLEANUP ---
echo.
echo 🛑 Shutting down server...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Local AI Web Launcher" >nul 2>&1
echo Done.
pause
