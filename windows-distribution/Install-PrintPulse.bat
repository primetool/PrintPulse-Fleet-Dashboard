@echo off
setlocal enabledelayedexpansion
title PrintPulse Fleet Hub - Windows Setup and Installer
color 0B

echo ==============================================================================
echo                PRINTPULSE CENTRAL FLEET HUB - WINDOWS INSTALLER
echo ==============================================================================
echo.
echo   Welcome to the PrintPulse Setup Wizard.
echo   This installer will configure PrintPulse on your Windows machine without
echo   requiring administrative rights or external dependencies.
echo.

REM Determine script directory and normalize by removing trailing backslash
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Search candidate locations for pre-built PrintPulse.exe
set "EXE_PATH="
set "EXE_SOURCE="

if exist "%SCRIPT_DIR%\PrintPulse.exe" (
    set "EXE_PATH=%SCRIPT_DIR%\PrintPulse.exe"
    set "EXE_SOURCE=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%\windows-distribution\PrintPulse.exe" (
    set "EXE_PATH=%SCRIPT_DIR%\windows-distribution\PrintPulse.exe"
    set "EXE_SOURCE=%SCRIPT_DIR%\windows-distribution"
) else if exist "%SCRIPT_DIR%\..\PrintPulse.exe" (
    set "EXE_PATH=%SCRIPT_DIR%\..\PrintPulse.exe"
    set "EXE_SOURCE=%SCRIPT_DIR%\.."
) else if exist "%SCRIPT_DIR%\..\windows-distribution\PrintPulse.exe" (
    set "EXE_PATH=%SCRIPT_DIR%\..\windows-distribution\PrintPulse.exe"
    set "EXE_SOURCE=%SCRIPT_DIR%\..\windows-distribution"
) else if exist "%USERPROFILE%\Downloads\PrintPulse.exe" (
    set "EXE_PATH=%USERPROFILE%\Downloads\PrintPulse.exe"
    set "EXE_SOURCE=%USERPROFILE%\Downloads"
) else if exist "%USERPROFILE%\Downloads\PrintPulse-Windows\PrintPulse.exe" (
    set "EXE_PATH=%USERPROFILE%\Downloads\PrintPulse-Windows\PrintPulse.exe"
    set "EXE_SOURCE=%USERPROFILE%\Downloads\PrintPulse-Windows"
) else if exist "%USERPROFILE%\Downloads\PrintPulse-Windows\windows-distribution\PrintPulse.exe" (
    set "EXE_PATH=%USERPROFILE%\Downloads\PrintPulse-Windows\windows-distribution\PrintPulse.exe"
    set "EXE_SOURCE=%USERPROFILE%\Downloads\PrintPulse-Windows\windows-distribution"
)

REM If PrintPulse.exe not found directly, search Downloads folder and subfolders
if "%EXE_PATH%"=="" (
    for /d %%D in ("%USERPROFILE%\Downloads\*PrintPulse*") do (
        if exist "%%D\PrintPulse.exe" (
            set "EXE_PATH=%%D\PrintPulse.exe"
            set "EXE_SOURCE=%%D"
        ) else if exist "%%D\windows-distribution\PrintPulse.exe" (
            set "EXE_PATH=%%D\windows-distribution\PrintPulse.exe"
            set "EXE_SOURCE=%%D\windows-distribution"
        )
    )
)

REM If PrintPulse.exe not found directly, check if PrintPulse-Windows.zip archive is present
if "%EXE_PATH%"=="" (
    set "ZIP_PATH="
    if exist "%SCRIPT_DIR%\PrintPulse-Windows.zip" set "ZIP_PATH=%SCRIPT_DIR%\PrintPulse-Windows.zip"
    if exist "%SCRIPT_DIR%\..\PrintPulse-Windows.zip" set "ZIP_PATH=%SCRIPT_DIR%\..\PrintPulse-Windows.zip"
    if exist "%SCRIPT_DIR%\..\..\PrintPulse-Windows.zip" set "ZIP_PATH=%SCRIPT_DIR%\..\..\PrintPulse-Windows.zip"
    if exist "%USERPROFILE%\Downloads\PrintPulse-Windows.zip" set "ZIP_PATH=%USERPROFILE%\Downloads\PrintPulse-Windows.zip"

    if "!ZIP_PATH!"=="" (
        for %%F in ("%USERPROFILE%\Downloads\*PrintPulse*.zip") do (
            if exist "%%F" set "ZIP_PATH=%%F"
        )
    )
    if "!ZIP_PATH!"=="" (
        for %%F in ("%USERPROFILE%\Downloads\*Windows*.zip") do (
            if exist "%%F" set "ZIP_PATH=%%F"
        )
    )

    if not "!ZIP_PATH!"=="" (
        echo [INFO] Found PrintPulse package archive: '!ZIP_PATH!'
        echo [INFO] Extracting PrintPulse binary and runtime files...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '!ZIP_PATH!' -DestinationPath '%SCRIPT_DIR%\temp_extract' -Force"
        if exist "%SCRIPT_DIR%\temp_extract\PrintPulse.exe" (
            copy /y "%SCRIPT_DIR%\temp_extract\PrintPulse.exe" "%SCRIPT_DIR%\PrintPulse.exe" >nul 2>nul
            set "EXE_PATH=%SCRIPT_DIR%\PrintPulse.exe"
            set "EXE_SOURCE=%SCRIPT_DIR%\temp_extract"
        ) else if exist "%SCRIPT_DIR%\temp_extract\windows-distribution\PrintPulse.exe" (
            copy /y "%SCRIPT_DIR%\temp_extract\windows-distribution\PrintPulse.exe" "%SCRIPT_DIR%\PrintPulse.exe" >nul 2>nul
            set "EXE_PATH=%SCRIPT_DIR%\PrintPulse.exe"
            set "EXE_SOURCE=%SCRIPT_DIR%\temp_extract\windows-distribution"
        )
    )
)

REM If PrintPulse.exe is still missing (e.g. downloaded source archive from GitHub without binary)
if "%EXE_PATH%"=="" (
    echo ==============================================================================
    echo   [NOTICE] PrintPulse.exe was not detected in the current folder.
    echo ==============================================================================
    echo.
    echo   If you already downloaded 'PrintPulse-Windows.zip' in your Downloads folder:
    echo     1. Right-click 'PrintPulse-Windows.zip' and select 'Extract All...'.
    echo     2. Open the extracted folder and run 'Install-PrintPulse.bat'.
    echo.
    echo   Choose how you would like to proceed:
    echo.
    echo   [1] Scan/Browse for downloaded PrintPulse-Windows.zip or PrintPulse.exe
    echo   [2] Quick Portable Setup (Downloads standalone runner, 100%% automatic)
    echo   [3] Compile PrintPulse.exe from local source code (requires Node.js)
    echo   [4] Open Dashboard in Browser (to download PrintPulse-Windows.zip)
    echo   [5] Exit installer
    echo.
    set /p "USER_CHOICE=Enter choice [1-5, Default=1]: "
    if "!USER_CHOICE!"=="" set "USER_CHOICE=1"

    if "!USER_CHOICE!"=="1" (
        echo.
        echo Searching common download locations...
        set "FOUND_PATH="
        for %%P in (
            "%USERPROFILE%\Downloads\PrintPulse-Windows.zip"
            "%USERPROFILE%\Downloads\PrintPulse.exe"
            "%USERPROFILE%\Desktop\PrintPulse-Windows.zip"
            "%USERPROFILE%\Desktop\PrintPulse.exe"
        ) do (
            if exist "%%~P" (
                echo [FOUND] %%~P
                set "FOUND_PATH=%%~P"
            )
        )
        if "!FOUND_PATH!"=="" (
            echo.
            set /p "CUSTOM_PATH=Enter the full path to PrintPulse-Windows.zip or PrintPulse.exe: "
            if exist "!CUSTOM_PATH!" set "FOUND_PATH=!CUSTOM_PATH!"
        )
        if not "!FOUND_PATH!"=="" (
            if "!FOUND_PATH:~-4!"==".zip" (
                echo [INFO] Extracting '!FOUND_PATH!'...
                powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '!FOUND_PATH!' -DestinationPath '%SCRIPT_DIR%' -Force"
                if exist "%SCRIPT_DIR%\PrintPulse.exe" set "EXE_PATH=%SCRIPT_DIR%\PrintPulse.exe"
                if exist "%SCRIPT_DIR%\windows-distribution\PrintPulse.exe" set "EXE_PATH=%SCRIPT_DIR%\windows-distribution\PrintPulse.exe"
            ) else (
                set "EXE_PATH=!FOUND_PATH!"
            )
            set "EXE_SOURCE=%SCRIPT_DIR%"
        )
        if "!EXE_PATH!"=="" (
            echo [ERROR] Could not locate PrintPulse.exe.
            pause
            exit /b 1
        )
    ) else if "!USER_CHOICE!"=="2" (
        echo.
        echo [INFO] Performing Quick Portable Setup...
        echo Downloading official standalone Node runner from nodejs.org...
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
          "$ProgressPreference = 'SilentlyContinue'; ^
           [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
           try { ^
             (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v18.20.4/win-x64/node.exe', '%SCRIPT_DIR%\node.exe'); ^
             Write-Host '[SUCCESS] Download complete.' -ForegroundColor Green; ^
           } catch { ^
             Write-Host '[ERROR] Download failed: ' $_.Exception.Message -ForegroundColor Red; ^
           }"
        if exist "%SCRIPT_DIR%\node.exe" (
            echo [SUCCESS] Portable runner ready!
            set "PORTABLE_NODE=%SCRIPT_DIR%\node.exe"
        ) else (
            echo [ERROR] Could not download portable runner.
            pause
            exit /b 1
        )
    ) else if "!USER_CHOICE!"=="3" (
        echo.
        echo [INFO] Attempting to build PrintPulse.exe from source...
        if exist "%SCRIPT_DIR%\build-exe.bat" (
            call "%SCRIPT_DIR%\build-exe.bat"
        ) else if exist "%SCRIPT_DIR%\..\build-exe.bat" (
            call "%SCRIPT_DIR%\..\build-exe.bat"
        ) else (
            echo [ERROR] build-exe.bat was not found.
            pause
            exit /b 1
        )

        if exist "%SCRIPT_DIR%\PrintPulse.exe" (
            set "EXE_PATH=%SCRIPT_DIR%\PrintPulse.exe"
            set "EXE_SOURCE=%SCRIPT_DIR%"
        ) else if exist "%SCRIPT_DIR%\windows-distribution\PrintPulse.exe" (
            set "EXE_PATH=%SCRIPT_DIR%\windows-distribution\PrintPulse.exe"
            set "EXE_SOURCE=%SCRIPT_DIR%\windows-distribution"
        ) else (
            echo [ERROR] Build did not produce PrintPulse.exe.
            pause
            exit /b 1
        )
    ) else if "!USER_CHOICE!"=="4" (
        start https://ais-dev-by2z5qbzbvlyqsugohtwr3-386799138494.europe-west2.run.app/
        echo Opened PrintPulse Cloud Hub in your default browser.
        echo In the top bar, click 'Windows App' or 'Download ZIP' to save PrintPulse-Windows.zip.
        echo Once downloaded, extract the ZIP and run Install-PrintPulse.bat.
        pause
        exit /b 0
    ) else (
        echo Installation cancelled.
        exit /b 0
    )
)

echo [OK] Found PrintPulse executable at:
echo      %EXE_PATH%
echo.

REM Set Destination Installation Directory in LocalAppData
set "INSTALL_DIR=%LOCALAPPDATA%\PrintPulse"

echo [1/4] Preparing installation directory...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\dist" mkdir "%INSTALL_DIR%\dist"

echo [2/4] Copying PrintPulse files to %INSTALL_DIR%...
copy /y "%EXE_PATH%" "%INSTALL_DIR%\PrintPulse.exe" >nul
if exist "%EXE_SOURCE%\Start-PrintPulse.bat" (
    copy /y "%EXE_SOURCE%\Start-PrintPulse.bat" "%INSTALL_DIR%\Start-PrintPulse.bat" >nul
) else if exist "%SCRIPT_DIR%\Start-PrintPulse.bat" (
    copy /y "%SCRIPT_DIR%\Start-PrintPulse.bat" "%INSTALL_DIR%\Start-PrintPulse.bat" >nul
)

REM Copy dist web interface files
if exist "%EXE_SOURCE%\dist" (
    xcopy /e /i /y "%EXE_SOURCE%\dist" "%INSTALL_DIR%\dist" >nul
) else if exist "%SCRIPT_DIR%\dist" (
    xcopy /e /i /y "%SCRIPT_DIR%\dist" "%INSTALL_DIR%\dist" >nul
) else if exist "%SCRIPT_DIR%\..\dist" (
    xcopy /e /i /y "%SCRIPT_DIR%\..\dist" "%INSTALL_DIR%\dist" >nul
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
