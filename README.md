# Local AI Web

A beautiful, local AI workspace that runs completely offline on your Linux machine.

![App Icon](icon.png)

## Features
- 🚀 **100% Local**: Works with your local Ollama instance.
- 🔒 **Private**: No data leaves your machine.
- 🕵️ **Tor Search**: Optional anonymous search capability using Tor.
- 💾 **Saves History**: Archive your chat sessions locally.
- 📱 **Responsive Design**: Modern, glassmorphic UI.

## Installation on Linux

Follow these steps to install the app on your computer.

### 1. Prerequisites
Make sure you have `git`, `python3` and `curl` installed. You also need [Ollama](https://ollama.com) installed and running.

```bash
sudo apt update
sudo apt install git python3 curl
```

### 2. Download the Code
Open your terminal and clone this repository:

```bash
git clone https://github.com/YOUR_USERNAME/local-ai-web.git
cd local-ai-web
```
*(Replace `YOUR_USERNAME` with the actual username after forking/cloning)*

### 3. Install the App
Run the included installation script. This will add "Local AI Web" to your application menu.

```bash
chmod +x install.sh
./install.sh
```

### 4. Run it!
You can now find **"Local AI Web"** in your system's application launcher.

Alternatively, you can run it manually from the terminal:
```bash
./start.sh
```

## Running Ollama
For the AI to work, make sure Ollama is running with CORS enabled:

```bash
OLLAMA_ORIGINS="*" ollama serve
```

## Uninstallation
To remove the app shortcut:
```bash
rm ~/.local/share/applications/local-ai-web.desktop
```
