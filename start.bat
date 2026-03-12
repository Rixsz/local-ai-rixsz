@echo off
echo 🚀 Starting Local AI Web UI...

REM Resolve the directory where the script is located to ensure we can find the server files
cd /d "%~dp0"

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Warning: Ollama doesn't seem to be running.
    echo Please start Ollama with CORS support allowed:
    echo    set OLLAMA_ORIGINS="*" ^& ollama serve
    echo.
)

echo 📂 Serving files at http://localhost:8000
echo Press Ctrl+C to stop the server.

REM Use custom Python server
python server.py
pause
