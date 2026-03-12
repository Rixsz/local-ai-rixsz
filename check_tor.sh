#!/bin/bash
# Check if Tor is installed
if ! command -v tor &> /dev/null; then
    echo "❌ Tor is not installed."
    if command -v apt &> /dev/null; then
        echo "Please run: sudo apt install tor"
    elif command -v pacman &> /dev/null; then
        echo "Please run: sudo pacman -S tor"
    elif command -v dnf &> /dev/null; then
        echo "Please run: sudo dnf install tor"
    else
        echo "Please install 'tor' using your package manager."
    fi
    exit 1
fi

# Check if Tor is running (process check)
if pgrep -x "tor" > /dev/null; then
    echo "✅ Tor process is running."
else
    echo "⚠️ Tor process is NOT running."
    echo "Attempting to start..."
    # Try to start it (might need sudo, but give it a shot or tell user)
    echo "Please run: sudo systemctl start tor"
fi

# Check port 9050
if nc -z 127.0.0.1 9050; then
    echo "✅ Tor SOCKS proxy is listening on port 9050."
else
    echo "❌ Port 9050 is not accepting connections. Check /etc/tor/torrc"
fi
