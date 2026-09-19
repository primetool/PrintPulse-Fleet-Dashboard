@echo off
setlocal enabledelayedexpansion
echo =======================================================
echo   PrintPulse - Windows Distribution Builder
echo =======================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

call npm install
if errorlevel 1 goto :failed
call npm run build:standalone
if errorlevel 1 goto :failed
call npx pkg@5.8.1 dist\server-standalone.cjs --target node18-win-x64 --output PrintPulse.exe
if errorlevel 1 goto :failed

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package-windows.ps1" -ProjectRoot "%~dp0"
if errorlevel 1 goto :failed

echo.
echo Created PrintPulse-Windows.zip successfully.
pause
exit /b 0

:failed
echo [ERROR] Build failed. Review the error above.
pause
exit /b 1
