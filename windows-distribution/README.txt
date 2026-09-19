# PrintPulse Windows distribution

Extract the entire ZIP, then run `Install-PrintPulse.bat`.

The installer copies PrintPulse to `%LOCALAPPDATA%\PrintPulse`, copies the complete dashboard `dist` folder, and creates:

- A Desktop shortcut named **PrintPulse Fleet Hub**
- A Start Menu shortcut under **Programs > PrintPulse**
- An uninstall shortcut in the same Start Menu folder

The shortcut starts the server and opens http://localhost:3000.

Do not move `PrintPulse.exe` out of the extracted folder before running the installer. If Windows SmartScreen blocks the unsigned executable, choose **More info**, then **Run anyway**, if you trust the source.
