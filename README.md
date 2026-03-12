# Local AI Web

A beautiful, local AI workspace that runs completely offline on your Linux machine.

![App Icon](icon.png)

## Features
- 🚀 **100% Local**: Works with your local Ollama instance.
- 🔒 **Private**: No data leaves your machine.
- 🧅 **Dark Web Access**: Search .onion sites via Tor and Ahmia.
- 🕵️ **Tor Search**: Anonymous search capability using Tor network.
- 💾 **Saves History**: Archive your chat sessions locally.
- 📱 **Responsive Design**: Modern, glassmorphic UI.

## Special Commands

### Tor Search (Regular Web)
Search the regular web anonymously via Tor:
```
/search-tor latest news
```

### Dark Web Search (.onion sites)
Search the dark web using Ahmia:
```
/search-deep hidden wiki
```

### Natural Language Search
You can also use natural language:
```
search for cybersecurity news
```

## Installation & Running

This project now runs natively across multiple Linux distributions (Ubuntu/Debian, Arch, Fedora) and Windows.

### 1. Prerequisites
You need [Ollama](https://ollama.com) installed and running, along with Python 3.

*   **Linux**: Make sure you have `git`, `python3`, and `curl` installed.
*   **Windows**: Download and install [Python for Windows](https://www.python.org/downloads/) (Make sure to check "Add Python to PATH" during installation) and [Git for Windows](https://git-scm.com/download/win).

### 2. Download the Code
Open your terminal (or Command Prompt/PowerShell on Windows) and clone this repository:

```bash
git clone https://github.com/YOUR_USERNAME/local-ai-web.git
cd local-ai-web
```
*(Replace `YOUR_USERNAME` with the actual username after forking/cloning)*

### 3. Installation & Setup

**On Linux (Ubuntu, Arch, Fedora, etc.):**
Run the included installation script. This will add "Local AI Web" to your application menu.
```bash
chmod +x install.sh
./install.sh
```

**On Windows:**
Double-click the `install.bat` file in the folder. This will automatically create a shortcut to the application directly on your Desktop.

### 4. Tor Setup (Optional but required for Tor web search)
To use the secure search features:
*   **Linux**: Run `./check_tor.sh`. It will automatically detect your OS and tell you how to install Tor using your package manager (apt, pacman, or dnf).
*   **Windows**: Download the [Tor Expert Bundle](https://www.torproject.org/download/tor/) for Windows. Extract it, and add the folder containing `tor.exe` to your System PATH variables. Then run `check_tor.bat` to verify.

### 5. Run the Application

**On Linux:**
Find **"Local AI Web"** in your system's application launcher, or run:
```bash
./start.sh
```

**On Windows:**
Double-click the **Local AI Web** shortcut on your Desktop, or run:
```cmd
start.bat
```

## Running Ollama
For the AI to function properly, make sure Ollama is running with CORS enabled.

**Linux:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

**Windows (Command Prompt):**
```cmd
set OLLAMA_ORIGINS="*" & ollama serve
```

## Uninstallation

**Linux:**
```bash
rm ~/.local/share/applications/local-ai-web.desktop
```

**Windows:**
Simply delete the shortcut from your Desktop and remove the downloaded folder.
