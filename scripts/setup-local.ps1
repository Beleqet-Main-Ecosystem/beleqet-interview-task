# Beleqet — local development setup (Windows PowerShell)
# Run from repo root: npm run setup

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "`n=== Step 1: Start Postgres + Redis (Docker) ===" -ForegroundColor Cyan
Set-Location $root
docker compose up -d db redis
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker failed. Open Docker Desktop, wait until it is running, then re-run." -ForegroundColor Red
  exit 1
}

Write-Host "Waiting for Postgres..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "`n=== Step 2: Backend setup ===" -ForegroundColor Cyan
Set-Location $backend
if (-not (Test-Path "node_modules")) { npm install }
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created backend/.env from .env.example" -ForegroundColor Yellow
}
npm run prisma:generate
npx prisma db push
npm run prisma:seed

Write-Host "`n=== Step 3: Frontend setup ===" -ForegroundColor Cyan
Set-Location $frontend
if (-not (Test-Path "node_modules")) { npm install }
if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Created frontend/.env.local from .env.example" -ForegroundColor Yellow
}

Write-Host "`n=== Ready! Start servers in two terminals ===" -ForegroundColor Green
Write-Host "  Terminal 1: npm run dev:api"
Write-Host "  Terminal 2: npm run dev:web"
Write-Host ""
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  API:      http://localhost:4000/api/v1"
Write-Host "  Swagger:  http://localhost:4000/api/docs"
