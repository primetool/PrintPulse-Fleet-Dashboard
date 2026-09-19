@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   PrintPulse - Windows Distribution Builder
echo =======================================================
echo.
echo This creates PrintPulse-Windows.zip containing:
echo   - PrintPulse.exe
echo   - dist\ (production dashboard)
echo   - Start-PrintPulse.bat
echo   - README.txt
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js 18 or 20 from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo [2/4] Building the dashboard and standalone server...
call npm run build:standalone
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Project compilation failed.
    pause
    exit /b 1
)

echo [3/4] Packaging PrintPulse.exe...
call npx pkg@5.8.1 dist\server-standalone.cjs --target node18-win-x64 --output PrintPulse.exe
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Executable packaging failed.
    pause
    exit /b 1
)

if not exist "PrintPulse.exe" (
    echo [ERROR] PrintPulse.exe was not created.
    pause
    exit /b 1
)
if not exist "dist\index.html" (
    echo [ERROR] dist\index.html was not created.
    pause
    exit /b 1
)

echo [4/4] Creating the ZIP distribution...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package-windows.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ZIP packaging failed.
    pause
    exit /b 1
)

echo.
echo =======================================================
echo BUILD SUCCESSFUL
echo =======================================================
echo ZIP: %CD%\PrintPulse-Windows.zip
echo Extract it, then run Start-PrintPulse.bat.
echo The dashboard opens at http://localhost:3000.
echo =======================================================
echo.
pause
