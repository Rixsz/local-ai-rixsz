import os
import subprocess
import sys

def build():
    print("📦 Starting Cross-Platform Build Process...")
    
    # 1. Install PyInstaller if missing
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 2. Build the Backend (server.py)
    # --onefile: bundle into a single exe/bin
    # --add-data: include front-end files
    print("🔨 Compiling Backend & UI Bundle...")
    
    platform_sep = ';' if os.name == 'nt' else ':'
    cmd = [
        "pyinstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        f"--add-data=index.html{platform_sep}.",
        f"--add-data=style.css{platform_sep}.",
        f"--add-data=script.js{platform_sep}.",
        f"--add-data=imageGenerator.js{platform_sep}.",
        f"--add-data=icon.png{platform_sep}.",
        "--icon=icon.png",
        "--name=LocalAI_RIXSZ",
        "server.py"
    ]
    
    try:
        subprocess.check_call(cmd)
        print("\n✅ Build Complete!")
        print(f"📍 Binary located in: {os.path.abspath('dist')}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Build Failed: {e}")

if __name__ == "__main__":
    build()
