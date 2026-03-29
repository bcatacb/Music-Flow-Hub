# SonicStudio - Windows Version

A full-stack music production management platform for artists, producers, and creators.

## Requirements

- Windows 10/11
- Node.js 24 (LTS)
- PostgreSQL 14+
- pnpm

## Quick Start

### 1. Install Prerequisites

**Install Node.js 24:**
Download and install from https://nodejs.org/en/download/

**Install pnpm (PowerShell as Administrator):**
```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**Install PostgreSQL:**
Download and install from https://www.postgresql.org/download/windows/
During install:
- Set password for `postgres` user (remember this!)
- Keep default port 5432
- Install pgAdmin (optional but recommended)

### 2. Setup Database

Open **pgAdmin** or **psql** and run:
```sql
CREATE USER sonicstudio WITH PASSWORD 'sonicstudio';
CREATE DATABASE sonicstudio OWNER sonicstudio;
```

Or in Command Prompt:
```cmd
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE USER sonicstudio WITH PASSWORD 'sonicstudio';"
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE DATABASE sonicstudio OWNER sonicstudio;"
```

### 3. Install Dependencies

Open PowerShell in the project folder:
```powershell
pnpm install
```

### 4. Set Environment Variables

In PowerShell:
```powershell
$env:DATABASE_URL = "postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
$env:PORT = "3000"
```

Or set system-wide via System Properties → Environment Variables.

### 5. Push Database Schema

```powershell
$env:DATABASE_URL = "postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
pnpm --filter @workspace/db run push
```

### 6. Start the Servers

**Terminal 1 - API Server:**
```powershell
$env:PORT = "3000"
$env:DATABASE_URL = "postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
$env:NODE_ENV = "development"
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 - Frontend:**
```powershell
$env:PORT = "22226"
$env:BASE_PATH = "/"
pnpm --filter @workspace/music-studio run dev
```

## Access

- Frontend: http://localhost:22226
- API: http://localhost:3000/api/health

## Troubleshooting

**Port already in use:**
Change `$env:PORT` to a different number (e.g., 3001, 3002)

**PostgreSQL connection refused:**
Ensure PostgreSQL service is running: `services.msc` → PostgreSQL → Start

**pnpm not recognized:**
Close and reopen PowerShell after installing pnpm

## Features

- **Projects**: Organize all creative work
- **Lyrics**: Write and manage lyric documents
- **Instrumentals**: Track beats and metadata (BPM, key, genre)
- **Songs**: Combine lyrics + instrumentals
- **Releases**: Plan and track music releases
- **Analytics**: Track streams/downloads/likes per song

## Tech Stack

- React + Vite + TypeScript
- Express 5 API
- PostgreSQL + Drizzle ORM
- pnpm workspaces
