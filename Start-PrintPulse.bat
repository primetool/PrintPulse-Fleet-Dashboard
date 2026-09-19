@echo off
setlocal enabledelayedexpansion
title PrintPulse Central Fleet Hub
color 0A

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "TARGET_EXE=%SCRIPT_DIR%\PrintPulse.exe"

if not exist "%TARGET_EXE%" (
    echo [ERROR] PrintPulse.exe was not found next to this startup script.
    echo Extract the complete PrintPulse-Windows.zip before running this file.
    pause
    exit /b 1
)

if not exist "%SCRIPT_DIR%\dist\index.html" (
    echo [ERROR] The dist folder is missing or incomplete.
    echo Extract the complete PrintPulse-Windows.zip before running this file.
    pause
    exit /b 1
)

echo Starting PrintPulse at http://localhost:3000 ...
cd /d "%SCRIPT_DIR%"
start "PrintPulse Server" /D "%SCRIPT_DIR%" "%TARGET_EXE%"

set "READY="
for /L %%N in (1,1,20) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/health' -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "READY=1"
        goto :open
    )
    timeout /t 1 /nobreak >nul
)

:open
start "" "http://localhost:3000"
if not defined READY echo [WARNING] The server did not respond within 20 seconds. Check the server window for errors.
echo PrintPulse is running. Close the PrintPulse Server window to stop it.
pause
