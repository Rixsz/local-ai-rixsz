@echo off
echo Installing Local AI Web...

set "SCRIPT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Local AI Web.lnk"
set "ICON_PATH=%SCRIPT_DIR%icon.png"

echo Creating shortcut on Desktop...
powershell -command "$wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut('%SHORTCUT_PATH%'); $shortcut.TargetPath = '%SCRIPT_DIR%start.bat'; $shortcut.WorkingDirectory = '%SCRIPT_DIR%'; if (Test-Path '%ICON_PATH%') { $shortcut.IconLocation = '%ICON_PATH%' }; $shortcut.Save()"

echo ✅ Installation complete!
echo You can now launch "Local AI Web" directly from your Desktop.
pause
