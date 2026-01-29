#!/bin/bash

# Install Script for Local AI Web
# This script creates a .desktop file in the user's application directory

APP_NAME="Local AI Web"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
ICON_PATH="$APP_DIR/icon.png"
EXEC_PATH="$APP_DIR/start.sh"
DESKTOP_FILE="local-ai-web.desktop"
INSTALL_DIR="$HOME/.local/share/applications"

echo "Installing $APP_NAME..."
echo "Path: $APP_DIR"

# Ensure the executable bit is set
chmod +x "$EXEC_PATH"

# Create the .desktop file content
cat > "$APP_DIR/$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=Local AI Web Interface
Exec=$EXEC_PATH
Icon=$ICON_PATH
Terminal=true
Categories=Utility;Development;
StartupNotify=true
EOF

# Install it
mkdir -p "$INSTALL_DIR"
cp "$APP_DIR/$DESKTOP_FILE" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/$DESKTOP_FILE"

echo "✅ Installation complete!"
echo "Search for '$APP_NAME' in your application menu."
