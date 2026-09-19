@echo off
setlocal enabledelayedexpansion
title PrintPulse Central Fleet Hub
color 0A

echo ==============================================================================
echo                     PRINTPULSE FLEET TELEMETRY SERVER
echo ==============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "TARGET_EXE="
if exist "%SCRIPT_DIR%\PrintPulse.exe" (
    set "TARGET_EXE=%SCRIPT_DIR%\PrintPulse.exe"
) else if exist "%SCRIPT_DIR%\windows-distribution\PrintPulse.exe" (
    set "TARGET_EXE=%SCRIPT_DIR%\windows-distribution\PrintPulse.exe"
) else if exist "%SCRIPT_DIR%\..\PrintPulse.exe" (
    set "TARGET_EXE=%SCRIPT_DIR%\..\PrintPulse.exe"
) else if exist "%SCRIPT_DIR%\..\windows-distribution\PrintPulse.exe" (
    set "TARGET_EXE=%SCRIPT_DIR%\..\windows-distribution\PrintPulse.exe"
) else if exist "%LOCALAPPDATA%\PrintPulse\PrintPulse.exe" (
    set "TARGET_EXE=%LOCALAPPDATA%\PrintPulse\PrintPulse.exe"
) else if exist "%USERPROFILE%\Downloads\PrintPulse.exe" (
    set "TARGET_EXE=%USERPROFILE%\Downloads\PrintPulse.exe"
) else if exist "%USERPROFILE%\Downloads\PrintPulse-Windows\PrintPulse.exe" (
    set "TARGET_EXE=%USERPROFILE%\Downloads\PrintPulse-Windows\PrintPulse.exe"
) else if exist "%USERPROFILE%\Downloads\PrintPulse-Windows\windows-distribution\PrintPulse.exe" (
    set "TARGET_EXE=%USERPROFILE%\Downloads\PrintPulse-Windows\windows-distribution\PrintPulse.exe"
)

REM Search inside Downloads subdirectories
if "%TARGET_EXE%"=="" (
    for /d %%D in ("%USERPROFILE%\Downloads\*PrintPulse*") do (
        if exist "%%D\PrintPulse.exe" set "TARGET_EXE=%%D\PrintPulse.exe"
        if exist "%%D\windows-distribution\PrintPulse.exe" set "TARGET_EXE=%%D\windows-distribution\PrintPulse.exe"
    )
)

set "USE_NODE="
if "%TARGET_EXE%"=="" (
    if exist "%SCRIPT_DIR%\node.exe" (
        set "USE_NODE=%SCRIPT_DIR%\node.exe"
    ) else if exist "%LOCALAPPDATA%\PrintPulse\node.exe" (
        set "USE_NODE=%LOCALAPPDATA%\PrintPulse\node.exe"
    ) else (
        where node >nul 2>nul
        if !ERRORLEVEL! EQU 0 set "USE_NODE=node"
    )
)

if "%TARGET_EXE%"=="" if "%USE_NODE%"=="" (
    echo ==============================================================================
    echo [ERROR] PrintPulse.exe was not detected in this folder.
    echo ==============================================================================
    echo.
    echo   If you downloaded 'PrintPulse-Windows.zip':
    echo     1. Right-click 'PrintPulse-Windows.zip' in Downloads and click 'Extract All...'
    echo     2. Open the extracted folder and run 'Start-PrintPulse.bat' or 'Install-PrintPulse.bat'
    echo.
    echo   Launching Install-PrintPulse.bat to assist you...
    echo.
    if exist "%SCRIPT_DIR%\Install-PrintPulse.bat" (
        call "%SCRIPT_DIR%\Install-PrintPulse.bat"
        exit /b 0
    )
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

if not "%TARGET_EXE%"=="" (
    start "" "%TARGET_EXE%"
) else (
    set "BUNDLE="
    if exist "%SCRIPT_DIR%\dist\server-standalone.cjs" set "BUNDLE=%SCRIPT_DIR%\dist\server-standalone.cjs"
    if exist "%SCRIPT_DIR%\dist\server.cjs" set "BUNDLE=%SCRIPT_DIR%\dist\server.cjs"
    if exist "%LOCALAPPDATA%\PrintPulse\dist\server-standalone.cjs" set "BUNDLE=%LOCALAPPDATA%\PrintPulse\dist\server-standalone.cjs"
    if not "!BUNDLE!"=="" (
        start "" "%USE_NODE%" "!BUNDLE!"
    ) else (
        start "" "%USE_NODE%" "%SCRIPT_DIR%\server.ts"
    )
)

REM Give server a moment to initialize, then open browser
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
