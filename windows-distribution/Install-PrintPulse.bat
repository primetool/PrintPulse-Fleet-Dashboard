@echo off
setlocal enabledelayedexpansion
title PrintPulse Fleet Hub - Windows Setup & Installer
color 0B

echo ==============================================================================
echo                PRINTPULSE CENTRAL FLEET HUB - WINDOWS INSTALLER
echo ==============================================================================
echo.
echo   Welcome to the PrintPulse Setup Wizard.
echo   This installer will configure PrintPulse on your Windows machine without
echo   requiring administrative rights or external dependencies.
echo.

REM Determine source directory
set "SOURCE_DIR=%~dp0"
if exist "%SOURCE_DIR%windows-distribution\PrintPulse.exe" (
    set "EXE_SOURCE=%SOURCE_DIR%windows-distribution"
) else (
    set "EXE_SOURCE=%SOURCE_DIR%"
)

REM Verify executable exists
if not exist "%EXE_SOURCE%\PrintPulse.exe" (
    echo [ERROR] PrintPulse.exe was not found in:
    echo         %EXE_SOURCE%
    echo.
    echo If you downloaded the repository as a ZIP, please check:
    echo   1. The 'windows-distribution' folder or 'PrintPulse-Windows.zip'
    echo   2. Or run 'build-exe.bat' to build the executable from source.
    echo.
    pause
    exit /b 1
)

REM Set Destination Installation Directory in LocalAppData
set "INSTALL_DIR=%LOCALAPPDATA%\PrintPulse"

echo [1/4] Preparing installation directory...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\dist" mkdir "%INSTALL_DIR%\dist"

echo [2/4] Copying PrintPulse files to %INSTALL_DIR%...
copy /y "%EXE_SOURCE%\PrintPulse.exe" "%INSTALL_DIR%\PrintPulse.exe" >nul
if exist "%EXE_SOURCE%\Start-PrintPulse.bat" (
    copy /y "%EXE_SOURCE%\Start-PrintPulse.bat" "%INSTALL_DIR%\Start-PrintPulse.bat" >nul
)

REM Copy dist web interface files
if exist "%EXE_SOURCE%\dist" (
    xcopy /e /i /y "%EXE_SOURCE%\dist" "%INSTALL_DIR%\dist" >nul
) else if exist "%SOURCE_DIR%dist" (
    xcopy /e /i /y "%SOURCE_DIR%dist" "%INSTALL_DIR%\dist" >nul
)

REM Create uninstaller script inside target folder
(
echo @echo off
echo title Uninstall PrintPulse
echo echo Are you sure you want to remove PrintPulse from this computer?
echo echo Press any key to confirm or close this window to cancel.
echo pause ^>nul
echo taskkill /f /im PrintPulse.exe ^>nul 2^>^&1
echo del /q "%%USERPROFILE%%\Desktop\PrintPulse Fleet Hub.lnk" ^>nul 2^>^&1
echo rd /s /q "%%APPDATA%%\Microsoft\Windows\Start Menu\Programs\PrintPulse" ^>nul 2^>^&1
echo timeout /t 2 /nobreak ^>nul
echo rd /s /q "%INSTALL_DIR%" ^>nul 2^>^&1
echo echo PrintPulse has been successfully removed.
echo pause
) > "%INSTALL_DIR%\Uninstall-PrintPulse.bat"

echo [3/4] Creating Windows Shortcuts...
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\PrintPulse"

if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"

REM Create Desktop and Start Menu Shortcuts via PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WScriptShell = New-Object -ComObject WScript.Shell; ^
   $Shortcut = $WScriptShell.CreateShortcut('%DESKTOP_DIR%\PrintPulse Fleet Hub.lnk'); ^
   $Shortcut.TargetPath = '%INSTALL_DIR%\PrintPulse.exe'; ^
   $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; ^
   $Shortcut.Description = 'PrintPulse Fleet Telemetry Hub'; ^
   $Shortcut.Save(); ^
   $StartShortcut = $WScriptShell.CreateShortcut('%START_MENU_DIR%\PrintPulse Fleet Hub.lnk'); ^
   $StartShortcut.TargetPath = '%INSTALL_DIR%\PrintPulse.exe'; ^
   $StartShortcut.WorkingDirectory = '%INSTALL_DIR%'; ^
   $StartShortcut.Description = 'PrintPulse Fleet Telemetry Hub'; ^
   $StartShortcut.Save(); ^
   $UninstShortcut = $WScriptShell.CreateShortcut('%START_MENU_DIR%\Uninstall PrintPulse.lnk'); ^
   $UninstShortcut.TargetPath = '%INSTALL_DIR%\Uninstall-PrintPulse.bat'; ^
   $UninstShortcut.WorkingDirectory = '%INSTALL_DIR%'; ^
   $UninstShortcut.Save();" >nul 2>&1

echo [4/4] Verifying installation...
if exist "%INSTALL_DIR%\PrintPulse.exe" (
    echo.
    echo ==============================================================================
    echo                     INSTALLATION COMPLETED SUCCESSFULLY!
    echo ==============================================================================
    echo.
    echo   PrintPulse has been installed to:
    echo   - Path:     %INSTALL_DIR%
    echo   - Desktop:  "PrintPulse Fleet Hub" (shortcut created)
    echo   - Start:    Start Menu ^> Programs ^> PrintPulse
    echo   - Access:   http://localhost:3000
    echo   - Admin:    Default PIN: 2026
    echo.
    echo   Press any key to launch PrintPulse Fleet Hub right now...
    pause >nul
    
    cd /d "%INSTALL_DIR%"
    start "" "%INSTALL_DIR%\PrintPulse.exe"
    
    REM Optional wait then launch web app interface
    timeout /t 2 /nobreak >nul
    if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
        start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    ) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
        start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    ) else (
        start http://localhost:3000
    )
) else (
    echo [ERROR] Installation could not be completed.
    pause
)
