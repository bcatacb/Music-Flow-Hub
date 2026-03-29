# SonicStudio - Linux Version

A full-stack music production management platform for artists, producers, and creators.

## Requirements

- Ubuntu 22.04 (or compatible Linux distro)
- Node.js 24
- PostgreSQL
- pnpm

## Quick Start

```bash
# 1. Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 2. Install dependencies
pnpm install

# 3. Setup PostgreSQL database
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE USER sonicstudio WITH PASSWORD 'sonicstudio';"
sudo -u postgres psql -c "CREATE DATABASE sonicstudio OWNER sonicstudio;"

# 4. Set environment variables and push schema
export DATABASE_URL="postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
export PORT=3000
pnpm --filter @workspace/db run push

# 5. Start API server (Terminal 1)
export PORT=3000
export DATABASE_URL="postgres://sonicstudio:sonicstudio@localhost:5432/sonicstudio"
export NODE_ENV=development
pnpm --filter @workspace/api-server run dev

# 6. Start frontend (Terminal 2)
export PORT=22226
export BASE_PATH=/
pnpm --filter @workspace/music-studio run dev
```

## Access

- Frontend: http://localhost:22226
- API: http://localhost:3000/api/health

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
