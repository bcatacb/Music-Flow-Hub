@echo off
pnpm install --frozen-lockfile
pnpm --filter db push
