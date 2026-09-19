# PrintPulse - Windows Standalone Executable & Installer (.exe)

This repository includes everything needed to run or install PrintPulse as a standalone Windows application without needing Node.js, npm, or any external dependencies installed on your computer.

---

## 🚀 Option 1: 1-Click Automated Installer (Recommended)

To install PrintPulse like a regular Windows application:

1. Double-click **`Install-PrintPulse.bat`** (located in root or inside `windows-distribution/`).
2. The installer will:
   - Copy the application and bundled UI assets into `%LOCALAPPDATA%\PrintPulse` (no admin rights required).
   - Create a **Desktop shortcut** named **"PrintPulse Fleet Hub"**.
   - Create a **Start Menu shortcut** under **Programs > PrintPulse**.
   - Automatically launch PrintPulse in app-window mode.
3. **Web Dashboard**: `http://localhost:3000`
4. **Default Admin PIN**: `2026`

---

## ⚡ Option 2: Portable Run (Zero Installation)

If you just want to run the server without installing desktop shortcuts:

1. Double-click **`Start-PrintPulse.bat`** (or **`PrintPulse.exe`**).
2. The server starts immediately on port `3000`.
3. Your browser or native app window opens automatically at:
   👉 **`http://localhost:3000`**
4. Close the console window or press `Ctrl+C` to stop the server at any time.

---

## 🛡️ Windows SmartScreen / Defender Note

Because this is a standalone enterprise build that is not signed with a paid EV code-signing certificate, Windows SmartScreen may show:
> *"Windows protected your PC: Microsoft Defender SmartScreen prevented an unrecognized app from starting."*

👉 Simply click **"More info"** and then click **"Run anyway"**.

---

## 🛠️ Option 3: Rebuild `.exe` from Source

If you clone or download the source code from GitHub and wish to recompile the `.exe` yourself:

### Method A: One-Click Batch Builder
Double-click:
```cmd
build-exe.bat
```
This script will verify Node.js, run `npm install`, compile the production frontend, and package `PrintPulse.exe`.

### Method B: Via Terminal / PowerShell
```powershell
npm install
npm run build:exe
```

---

## ⚙️ Configuration & Environment Overrides

The executable supports optional environment overrides:
- `PORT`: Changes the server port (Default: `3000`). Example: `set PORT=8080 && PrintPulse.exe`
- `ADMIN_PIN`: Sets a custom admin passcode (Default: `2026`). Example: `set ADMIN_PIN=4590 && PrintPulse.exe`
- `GEMINI_API_KEY`: Connects Gemini AI copilot and predictive diagnostics.
- `NO_AUTO_OPEN=1`: Disables automatic browser launching on startup (ideal for background server racks).
