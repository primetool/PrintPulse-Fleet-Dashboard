@echo off
setlocal enabledelayedexpansion
echo =======================================================
echo   PrintPulse - Windows .exe Executable Builder
echo =======================================================
echo.
echo NOTE: If you just want to use PrintPulse, you do NOT need to build it!
echo       PrintPulse.exe is already included. You can simply double-click
echo       'Install-PrintPulse.bat' or 'Start-PrintPulse.bat' to run it now.
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo To build from source, install Node.js from https://nodejs.org/ (v18 or v20).
    echo.
    echo If you just want to run the pre-built application:
    echo   Double-click 'Install-PrintPulse.bat' or 'Start-PrintPulse.bat'
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

echo [2/4] Compiling dashboard UI and backend server...
call npm run build:standalone
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Project compilation failed.
    pause
    exit /b 1
)

echo [3/4] Packaging into standalone Windows executable (PrintPulse.exe)...
call npx pkg@5.8.1 dist\server-standalone.cjs --target node18-win-x64 --output PrintPulse.exe
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Executable packaging failed.
    pause
    exit /b 1
)

echo [4/4] Preparing Windows Distribution package...
if not exist "windows-distribution" mkdir windows-distribution
copy /y PrintPulse.exe windows-distribution\PrintPulse.exe >nul
copy /y Install-PrintPulse.bat windows-distribution\Install-PrintPulse.bat >nul
copy /y Start-PrintPulse.bat windows-distribution\Start-PrintPulse.bat >nul
if not exist "windows-distribution\dist" mkdir windows-distribution\dist
xcopy /e /i /y dist windows-distribution\dist >nul

echo.
echo =======================================================
echo   BUILD SUCCESSFUL!
echo   Executable created: PrintPulse.exe (in root)
echo   Distribution pack:  windows-distribution\
echo.
echo   To install and launch PrintPulse:
echo   Double-click Install-PrintPulse.bat or Start-PrintPulse.bat
echo =======================================================
echo.
pause
