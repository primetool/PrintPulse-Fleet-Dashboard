@echo off
setlocal enabledelayedexpansion
title PrintPulse Fleet Hub - Windows Installer
color 0B

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "EXE_PATH=%SCRIPT_DIR%\PrintPulse.exe"
set "DIST_PATH=%SCRIPT_DIR%\dist"
set "INSTALL_DIR=%LOCALAPPDATA%\PrintPulse"
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\PrintPulse"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

if not exist "%EXE_PATH%" (
    echo [ERROR] PrintPulse.exe was not found.
    echo Extract the complete PrintPulse-Windows.zip first.
    pause
    exit /b 1
)
if not exist "%DIST_PATH%\index.html" (
    echo [ERROR] The dist folder is missing or incomplete.
    echo Extract the complete PrintPulse-Windows.zip first.
    pause
    exit /b 1
)

echo Installing PrintPulse to:
 echo   %INSTALL_DIR%
echo.

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if exist "%INSTALL_DIR%\dist" rmdir /s /q "%INSTALL_DIR%\dist"
mkdir "%INSTALL_DIR%\dist"

copy /y "%EXE_PATH%" "%INSTALL_DIR%\PrintPulse.exe" >nul
xcopy /e /i /y "%DIST_PATH%" "%INSTALL_DIR%\dist" >nul
copy /y "%SCRIPT_DIR%\Start-PrintPulse.bat" "%INSTALL_DIR%\Start-PrintPulse.bat" >nul

if not exist "%INSTALL_DIR%\PrintPulse.exe" (
    echo [ERROR] Installation failed while copying the executable.
    pause
    exit /b 1
)

if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$shell = New-Object -ComObject WScript.Shell;" ^
  "$desktop = $shell.CreateShortcut('%DESKTOP_DIR%\PrintPulse Fleet Hub.lnk');" ^
  "$desktop.TargetPath = '%INSTALL_DIR%\Start-PrintPulse.bat';" ^
  "$desktop.WorkingDirectory = '%INSTALL_DIR%';" ^
  "$desktop.Description = 'PrintPulse Fleet Telemetry Hub';" ^
  "$desktop.IconLocation = '%INSTALL_DIR%\PrintPulse.exe,0';" ^
  "$desktop.Save();" ^
  "$start = $shell.CreateShortcut('%START_MENU_DIR%\PrintPulse Fleet Hub.lnk');" ^
  "$start.TargetPath = '%INSTALL_DIR%\Start-PrintPulse.bat';" ^
  "$start.WorkingDirectory = '%INSTALL_DIR%';" ^
  "$start.Description = 'PrintPulse Fleet Telemetry Hub';" ^
  "$start.IconLocation = '%INSTALL_DIR%\PrintPulse.exe,0';" ^
  "$start.Save();" ^
  "$uninstall = $shell.CreateShortcut('%START_MENU_DIR%\Uninstall PrintPulse.lnk');" ^
  "$uninstall.TargetPath = '%INSTALL_DIR%\Uninstall-PrintPulse.bat';" ^
  "$uninstall.WorkingDirectory = '%INSTALL_DIR%';" ^
  "$uninstall.Save();"

(
 echo @echo off
 echo taskkill /f /im PrintPulse.exe ^>nul 2^>^&1
 echo timeout /t 1 /nobreak ^>nul
 echo del /q "%DESKTOP_DIR%\PrintPulse Fleet Hub.lnk" ^>nul 2^>^&1
 echo del /q "%START_MENU_DIR%\PrintPulse Fleet Hub.lnk" ^>nul 2^>^&1
 echo del /q "%START_MENU_DIR%\Uninstall PrintPulse.lnk" ^>nul 2^>^&1
 echo rmdir /s /q "%INSTALL_DIR%"
 echo echo PrintPulse has been uninstalled.
 echo pause
) > "%INSTALL_DIR%\Uninstall-PrintPulse.bat"

echo.
echo Installation completed successfully.
echo Desktop shortcut: PrintPulse Fleet Hub
echo Start Menu:       Programs ^> PrintPulse ^> PrintPulse Fleet Hub
echo Dashboard:        http://localhost:3000
echo.
choice /c YN /n /m "Launch PrintPulse now? [Y/N] "
if errorlevel 2 exit /b 0
call "%INSTALL_DIR%\Start-PrintPulse.bat"
