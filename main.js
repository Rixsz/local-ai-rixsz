const { app, BrowserWindow, shell, protocol } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let pythonProcess;

// Register custom protocol for Google OAuth deep links
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('local-ai-rixsz', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('local-ai-rixsz');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d0d0d'
  });

  // Start the Python Backend
  startPythonBackend();

  // Load the web UI
  mainWindow.loadURL('http://localhost:8000');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (pythonProcess) pythonProcess.kill();
  });
}

function startPythonBackend() {
  const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
  pythonProcess = spawn(pythonCmd, ['server.py'], {
    cwd: __dirname
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });
}

// Handle Deep Links (for OAuth Callbacks)
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows/Linux deep link handling
app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  
  const url = commandLine.pop();
  if (url.startsWith('local-ai-rixsz://')) {
    handleDeepLink(url);
  }
});

function handleDeepLink(url) {
  console.log('Deep link received:', url);
  if (mainWindow) {
    mainWindow.webContents.send('oauth-callback', url);
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('ready', createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

process.on('exit', () => {
  if (pythonProcess) pythonProcess.kill();
});
