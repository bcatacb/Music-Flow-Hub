@echo off
chcp 65001 >nul
title SonicStudio Windows Installer
echo ==========================================
echo    SonicStudio for Windows - Setup
echo ==========================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this installer as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

set INSTALL_DIR=%ProgramFiles%\SonicStudio
set DATA_DIR=%ProgramData%\SonicStudio

echo Installing to: %INSTALL_DIR%
echo Data directory: %DATA_DIR%
echo.

:: Create directories
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DATA_DIR%\postgres" mkdir "%DATA_DIR%\postgres"

:: Check for Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 goto InstallNodeJS
for /f "tokens=*" %%a in ('node --version') do echo Found: %%a
goto CheckPnpm

:InstallNodeJS
    echo Installing Node.js 24 LTS...
    echo Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v24.0.0/node-v24.0.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'"
    echo Installing Node.js (this may take a few minutes)...
    msiexec /i "%TEMP%\node-installer.msi" /qn /norestart
    if %errorLevel% neq 0 (
        echo ERROR: Failed to install Node.js. Please install manually from https://nodejs.org
        pause
        exit /b 1
    )
    set "PATH=%PATH%;%ProgramFiles%\nodejs"
    del "%TEMP%\node-installer.msi"
    echo Node.js installed successfully!
    goto CheckPnpm

:CheckPnpm
echo.
echo [2/5] Checking pnpm...
pnpm --version >nul 2>&1
if %errorLevel% neq 0 goto InstallPnpm
for /f "tokens=*" %%a in ('pnpm --version') do echo Found: %%a
goto CheckPostgres

:InstallPnpm
    echo Installing pnpm...
    powershell -Command "iwr https://get.pnpm.io/install.ps1 -useb | iex"
    set "PATH=%PATH%;%LOCALAPPDATA%\pnpm"
    echo pnpm installed!
    goto CheckPostgres

:CheckPostgres
echo.
echo [3/5] Checking PostgreSQL...
"%ProgramFiles%\PostgreSQL\14\bin\psql.exe" --version >nul 2>&1
if %errorLevel% equ 0 goto PostgresFound
echo.
echo ==========================================
echo    POSTGRESQL NOT FOUND
echo ==========================================
echo.
echo Please download and install PostgreSQL 14+ from:
echo https://www.postgresql.org/download/windows/
echo.
echo During installation:
echo - Set password for 'postgres' user to: sonicstudio
echo - Keep default port: 5432
echo - Install pgAdmin (optional)
echo.
echo After installing PostgreSQL, run this installer again.
echo.
start https://www.postgresql.org/download/windows/
pause
exit /b 1

:PostgresFound
echo PostgreSQL found!

:: Setup database
echo.
echo [4/5] Setting up database...
echo Creating user and database...
"%ProgramFiles%\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE USER sonicstudio WITH PASSWORD 'sonicstudio';" 2>nul
"%ProgramFiles%\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE DATABASE sonicstudio OWNER sonicstudio;" 2>nul
if %errorLevel% equ 0 (
    echo Database setup complete!
) else (
    echo Note: Database may already exist, continuing...
)

:: Extract and install app
echo.
echo [5/5] Installing SonicStudio application...
echo Extracting files...

:: Copy app files (assuming they're bundled with the installer)
:: In a real installer, these would be extracted from the archive
if not exist "%~dp0Music-Flow-Hub-windows.zip" (
    echo ERROR: Music-Flow-Hub-windows.zip not found!
    echo Please ensure the zip file is in the same folder as this installer.
    pause
    exit /b 1
)

powershell -Command "Expand-Archive -Path '%~dp0Music-Flow-Hub-windows.zip' -DestinationPath '%INSTALL_DIR%' -Force"

:: Install dependencies
echo Installing dependencies (this may take 5-10 minutes)...
cd /d "%INSTALL_DIR%\Music-Flow-Hub"
call pnpm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

:: Push database schema
echo Setting up database schema...
set "DATABASE_URL=postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
call pnpm --filter @workspace/db run push

:: Create start script
echo Creating start scripts...
(
echo @echo off
chcp 65001 ^>nul
title SonicStudio - API Server
cd /d "%INSTALL_DIR%\Music-Flow-Hub"
set "PORT=3000"
set "DATABASE_URL=postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
set "NODE_ENV=development"
echo Starting API Server on http://localhost:3000
call pnpm --filter @workspace/api-server run dev
) > "%INSTALL_DIR%\Start-API-Server.bat"

(
echo @echo off
chcp 65001 ^>nul
title SonicStudio - Frontend
cd /d "%INSTALL_DIR%\Music-Flow-Hub"
set "PORT=22226"
set "BASE_PATH=/"
echo Starting Frontend on http://localhost:22226
call pnpm --filter @workspace/music-studio run dev
) > "%INSTALL_DIR%\Start-Frontend.bat"

:: Create desktop shortcuts
echo Creating desktop shortcuts...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PUBLIC%\Desktop\SonicStudio API Server.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\Start-API-Server.bat'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,14'; $Shortcut.Save()"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PUBLIC%\Desktop\SonicStudio Frontend.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\Start-Frontend.bat'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,14'; $Shortcut.Save()"

:: Create Start Menu entries
set STARTMENU=%ProgramData%\Microsoft\Windows\Start Menu\Programs\SonicStudio
if not exist "%STARTMENU%" mkdir "%STARTMENU%"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU%\SonicStudio API Server.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\Start-API-Server.bat'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,14'; $Shortcut.Save()"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU%\SonicStudio Frontend.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\Start-Frontend.bat'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,14'; $Shortcut.Save()"

echo.
echo ==========================================
echo    INSTALLATION COMPLETE!
echo ==========================================
echo.
echo SonicStudio has been installed to:
echo %INSTALL_DIR%
echo.
echo To start the application:
echo 1. Double-click "SonicStudio API Server" on your desktop
echo 2. Double-click "SonicStudio Frontend" on your desktop
echo.
echo Then open: http://localhost:22226
echo.
echo ==========================================
echo.
pause
