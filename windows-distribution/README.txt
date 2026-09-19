==============================================================================
PRINTPULSE FLEET TELEMETRY HUB - WINDOWS PORTABLE & INSTALLER PACKAGE
==============================================================================

HOW TO INSTALL & RUN PRINTPULSE ON WINDOWS:

OPTION 1: AUTOMATIC 1-CLICK INSTALLER (RECOMMENDED)
---------------------------------------------------
1. Double-click "Install-PrintPulse.bat"
2. PrintPulse will automatically install to your user AppData folder
3. A "PrintPulse Fleet Hub" shortcut will be placed on your Desktop & Start Menu
4. The dashboard will launch immediately in your browser or native app window!
   - URL: http://localhost:3000
   - Default Admin PIN: 2026


OPTION 2: PORTABLE RUN (NO INSTALLATION REQUIRED)
-------------------------------------------------
If you do not want to install shortcuts:
1. Double-click "Start-PrintPulse.bat" (or "PrintPulse.exe")
2. Open your web browser to: http://localhost:3000
3. To stop the server, simply close the console window or press Ctrl+C.


TROUBLESHOOTING & COMMON QUESTIONS:
-----------------------------------
Q: "Windows protected your PC / Microsoft Defender SmartScreen popup"
A: Because this is a custom-compiled enterprise utility not signed with an 
   expensive commercial certificate, Windows SmartScreen may show a prompt.
   Simply click "More info" -> "Run anyway".

Q: "How do I change the port?"
A: Set the PORT environment variable before running, or in Command Prompt:
   set PORT=8080 && PrintPulse.exe

Q: "How do I uninstall?"
A: If you ran the installer, double-click "Uninstall PrintPulse" from your 
   Start Menu, or run the uninstaller in %LOCALAPPDATA%\PrintPulse.
==============================================================================
