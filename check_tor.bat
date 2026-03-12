@echo off
echo Checking Tor status...

where tor >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Tor is not installed or not in your system PATH.
    echo Please download Tor Expert Bundle for Windows from the Tor Project website.
    echo Extract it and add the folder containing tor.exe to your System PATH variables.
    pause
    exit /b 1
)

tasklist /fi "imagename eq tor.exe" | find /i "tor.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Tor process is NOT running.
    echo Attempting to start Tor in the background...
    start /b tor.exe
    timeout /t 5 >nul
) else (
    echo ✅ Tor process is running.
)

REM Use PowerShell to check socket 9050 since Windows doesn't have netcat natively
powershell -command "try { $socket = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 9050); $socket.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Tor SOCKS proxy is listening on port 9050.
) else (
    echo ❌ Port 9050 is not accepting connections. Check your torrc file.
)
pause
