@echo off
setlocal enabledelayedexpansion
title Local AI Web - Installer

echo.
echo    __                     _     _    ___ 
echo   / /  ___   ___ __ _  ^| ^|_  /_\  ^|_ _^|
echo  / /  / _ \ / _// _` ^| ^| __^|//_\\  ^| ^| 
echo / /__^| (_) ^| (_^| (_^| ^| ^| ^|_/  _  \ ^| ^| 
echo \____/\___/ \___\__,_^|  \__\_/ \_/___^|
echo.
echo ==========================================
echo    ONE-CLICK AI WORKSPACE INSTALLER
echo ==========================================
echo.

REM Check for Admin Privileges (required for winget in some cases)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Running without Administrator privileges. 
    echo    If installation fails, please right-click this file and "Run as Administrator".
    echo.
)

REM --- CHECK FOR WINGET ---
where winget >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 'winget' not found. Please update Windows or install App Installer from Microsoft Store.
    pause
    exit /b
)

REM --- INSTALL DEPENDENCIES ---
echo 🔍 Checking Environment...

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [📥] Python not found. Installing...
    winget install -e --id Python.Python.3 --source winget --silent
) else (
    echo [✅] Python is ready.
)

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [📥] Node.js not found. Installing...
    winget install -e --id OpenJS.NodeJS --source winget --silent
) else (
    echo [✅] Node.js is ready.
)

REM Check Ollama
ollama -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [📥] Ollama not found. Installing...
    winget install -e --id Ollama.Ollama --source winget --silent
) else (
    echo [✅] Ollama is ready.
)

REM --- SETUP PROJECT ---
echo.
echo 🏗️  Installing UI Dependencies (npm)...
call npm install --quiet

REM --- CREATE SHORTCUT ---
echo.
echo 🖥️  Creating Desktop Shortcut...
set "SCRIPT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Local AI Web.lnk"
set "ICON_PATH=%SCRIPT_DIR%icon.png"

powershell -command "$wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut('%SHORTCUT_PATH%'); $shortcut.TargetPath = '%SCRIPT_DIR%start.bat'; $shortcut.WorkingDirectory = '%SCRIPT_DIR%'; if (Test-Path '%ICON_PATH%') { $shortcut.IconLocation = '%ICON_PATH%' }; $shortcut.Save()"

echo.
echo ==========================================
echo 🎉 SUCCESS! Local AI Web is ready.
echo ==========================================
echo.
echo 📍 A shortcut has been created on your Desktop.
echo.
echo 💡 Next Steps:
echo 1. Start Ollama from your Start Menu.
echo 2. Double-click the "Local AI Web" icon on your Desktop.
echo.
pause
