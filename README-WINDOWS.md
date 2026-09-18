# PrintPulse - Windows Standalone Executable (.exe)

This repository includes everything needed to run PrintPulse as a standalone Windows executable without needing Node.js installed on the host machine.

---

## 🚀 Option 1: Run the Pre-Built Executable

A ready-to-run Windows executable has already been compiled in this repository:

1. **`PrintPulse.exe`** (or extract **`PrintPulse-Windows.zip`** / the **`windows-distribution`** folder)
2. Double-click **`PrintPulse.exe`** or **`Start-PrintPulse.bat`**.
3. The server starts immediately on port `3000`.
4. Your default web browser will automatically open:
   👉 **`http://localhost:3000`**
5. **Default Admin PIN**: `2026`

---

## 🛠️ Option 2: Rebuild `.exe` from Source (After downloading from GitHub)

If you clone or download the repo from GitHub and want to compile a fresh `.exe` yourself on Windows:

### Method A: One-Click Batch Script (Easiest)
Simply double-click:
```cmd
build-exe.bat
```
This script automatically:
1. Installs npm packages
2. Bundles the production frontend UI and server logic
3. Generates the standalone `PrintPulse.exe` (x64)
4. Copies everything into `windows-distribution/`

---

### Method B: Via NPM Command
Open Command Prompt or PowerShell in the repository folder:

```powershell
# 1. Install packages
npm install

# 2. Build the Windows executable
npm run build:exe
```

The output **`PrintPulse.exe`** will be generated directly in the project root directory.

---

## ⚙️ Configuration & Environment Variables

The `.exe` supports optional environment overrides:
- `PORT`: Changes the server port (Default: `3000`). Example: `set PORT=8080 && PrintPulse.exe`
- `ADMIN_PIN`: Sets a custom admin passcode (Default: `2026`). Example: `set ADMIN_PIN=4590 && PrintPulse.exe`
- `GEMINI_API_KEY`: Connects Gemini AI copilot and predictive analytics.
- `NO_AUTO_OPEN=1`: Disables automatic browser launching on startup (ideal for background service or server racks).
