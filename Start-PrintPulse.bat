@echo off
setlocal enabledelayedexpansion
title PrintPulse Central Fleet Hub
color 0A

echo ==============================================================================
echo                     PRINTPULSE FLEET TELEMETRY SERVER
echo ==============================================================================
echo.

set "APP_DIR=%~dp0"
set "TARGET_EXE="

if exist "%APP_DIR%PrintPulse.exe" (
    set "TARGET_EXE=%APP_DIR%PrintPulse.exe"
) else if exist "%APP_DIR%windows-distribution\PrintPulse.exe" (
    set "TARGET_EXE=%APP_DIR%windows-distribution\PrintPulse.exe"
) else if exist "%LOCALAPPDATA%\PrintPulse\PrintPulse.exe" (
    set "TARGET_EXE=%LOCALAPPDATA%\PrintPulse\PrintPulse.exe"
)

if "%TARGET_EXE%"=="" (
    echo [ERROR] PrintPulse.exe was not found.
    echo.
    echo To resolve this:
    echo   1. If you just downloaded the repository, run 'Install-PrintPulse.bat'
    echo   2. Or extract 'PrintPulse-Windows.zip'
    echo   3. Or compile it by running 'build-exe.bat'
    echo.
    pause
    exit /b 1
)

echo   Starting PrintPulse Fleet Server...
echo   Local Web Interface: http://localhost:3000
echo   Default Admin PIN:   2026
echo.
echo   Press Ctrl+C at any time in this window to stop the server.
echo ==============================================================================
echo.

start "" "%TARGET_EXE%"

REM Give server a second to spin up, then open browser
timeout /t 2 /nobreak >nul
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
) else (
    start http://localhost:3000
)

echo Server running. You can keep this window open or minimize it.
pause
