#!/bin/bash

# Local AI Web Starter Script

# Resolve the directory where the script is located to ensure we can find the server files
cd "$(dirname "$0")" || exit

echo "🚀 Starting Local AI Web UI..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
  echo "⚠️  Warning: Ollama doesn't seem to be running."
  echo "Please start Ollama with CORS support allowed:"
  echo "   OLLAMA_ORIGINS=\"*\" ollama serve"
  echo ""
fi

# Start a local server
echo "📂 Serving files at http://localhost:8000"
echo "Press Ctrl+C to stop the server."

# Use custom Python server to support Tor search
python3 server.py
