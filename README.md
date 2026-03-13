# Local AI Web

A beautiful, local AI workspace that runs completely offline on your Linux machine.

![App Icon](icon.png)

## Features
- 🚀 **100% Local**: Works with your local Ollama instance.
- 🔒 **Private**: No data leaves your machine.
- 🔐 **Google Integration**: Connect your Google account to enable Web-Augmented Intelligence safely.
- 🧅 **Dark Web Access**: Search .onion sites via Tor and Ahmia.
- 🕵️ **Tor Search**: Anonymous search capability using Tor network.
- 💾 **Saves History**: Archive your chat sessions locally.
- 📱 **Desktop App**: Now bundled with Electron for deep-link OAuth support.
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

## 🚀 Super Easy Installation (Windows)

To install everything (Python, Node.js, Ollama, and the UI) in one go, just open **PowerShell** and paste this command:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; iwr https://raw.githubusercontent.com/rixsz/local-ai-web/main/install.bat -OutFile install.bat; .\install.bat
```

*Don't have PowerShell open? Just follow the steps below.*

---

## 🛠️ Installation & Running

### 1. Windows (Recommended)
1. **Download this repository** as a ZIP and extract it.
2. Double-click `install.bat`. 
   - *It will automatically check for and install Python, Node.js, and Ollama if you don't have them!*
3. Once finished, a **Local AI Web** shortcut will appear on your Desktop.
4. Double-click the shortcut to start chatting!

### 2. Linux (Ubuntu, Arch, Fedora, etc.)
1. Open your terminal and run:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
2. Find **"Local AI Web"** in your application menu.

---

## 🔧 Tor Setup (Optional)
To use the secure search features (/search-tor and /search-deep):
*   **Windows**: The installer will prompt you or you can download the [Tor Expert Bundle](https://www.torproject.org/download/tor/).
*   **Linux**: Run `./check_tor.sh` to get installation commands for your specific distro.

## 🦙 Running Ollama
The app needs Ollama to be running.
*   **Windows**: The app will try to detect it. If it fails, start Ollama and ensure CORS is enabled by setting the environment variable `OLLAMA_ORIGINS="*"` and restarting Ollama.
*   **Linux**:
    ```bash
    OLLAMA_ORIGINS="*" ollama serve
    ```

## 📦 What's Included?
- **AI Core**: Powered by Ollama.
- **Frontend**: Sleek Electron-based interface.
- **Intelligence**: RAG (Retrieval-Augmented Generation) system that reads your local files.
- **Search**: Tor & Dark Web integration for private intelligence gathering.
- **Google Sync**: Optional Google Account link for real-time web search.

