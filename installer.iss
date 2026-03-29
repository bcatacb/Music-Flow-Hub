; Inno Setup Script for SonicStudio Windows Installer
; Compile with Inno Setup 6: https://jrsoftware.org/isdl.php

#define MyAppName "SonicStudio"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SonicStudio"
#define MyAppURL "https://github.com/yourusername/Music-Flow-Hub"

[Setup]
AppId={{SonicStudio-2026}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\SonicStudio
DefaultGroupName=SonicStudio
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
OutputDir=.
OutputBaseFilename=SonicStudio-Setup
SetupIconFile=installer\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "installnodejs"; Description: "Install Node.js 24 LTS (if not present)"; GroupDescription: "Dependencies"; Flags: checked
Name: "installpostgres"; Description: "Install PostgreSQL 14 (required)"; GroupDescription: "Dependencies"; Flags: checked

[Files]
Source: "Music-Flow-Hub-windows.zip"; DestDir: "{app}"; Flags: ignoreversion
Source: "installer\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "installer\logo.bmp"; DestDir: "{tmp}"; Flags: ignoreversion
Source: "README-WINDOWS.md"; DestDir: "{app}"; DestName: "README.txt"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}\Start API Server"; Filename: "{app}\Start-API-Server.bat"; IconFilename: "{app}\icon.ico"
Name: "{autoprograms}\{#MyAppName}\Start Frontend"; Filename: "{app}\Start-Frontend.bat"; IconFilename: "{app}\icon.ico"
Name: "{autoprograms}\{#MyAppName}\README"; Filename: "{app}\README.txt"
Name: "{autodesktop}\{#MyAppName} API Server"; Filename: "{app}\Start-API-Server.bat"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon
Name: "{autodesktop}\{#MyAppName} Frontend"; Filename: "{app}\Start-Frontend.bat"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{tmp}\node-v24.0.0-x64.msi"; Parameters: "/qn /norestart"; StatusMsg: "Installing Node.js..."; Check: NeedsNodeJS; Tasks: installnodejs
Filename: "{tmp}\postgresql-14.12-1-windows-x64.exe"; Parameters: "--mode unattended --unattendedmodeui minimal --superpassword sonicstudio --serverport 5432"; StatusMsg: "Installing PostgreSQL..."; Tasks: installpostgres

[Code]
function NeedsNodeJS(): Boolean;
begin
  Result := not FileExists(ExpandConstant('{pf}\nodejs\node.exe'));
end;

procedure InitializeWizard();
begin
  WizardForm.WizardSmallBitmapImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\logo.bmp'));
end;
