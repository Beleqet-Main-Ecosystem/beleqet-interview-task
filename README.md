# Beleqet Jobs — Monorepo

Full-stack job platform: **Next.js** frontend + **NestJS** API + **PostgreSQL** + **Redis**.

```
beleqet-jobs/
├── frontend/          # Next.js 14 — deploy to Vercel
├── backend/           # NestJS API — deploy to Render (Docker)
├── scripts/           # Local setup helpers
├── docker-compose.yml # Postgres + Redis for local dev
├── render.yaml        # Render blueprint (backend + DB)
└── package.json       # Root scripts
```

## Quick start (local)

```bash
# 1. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Start database (from repo root)
docker compose up -d db redis

# 3. Install & seed
npm install --prefix backend
npm install --prefix frontend
npm run db:push
npm run db:seed

# 4. Run (two terminals)
npm run dev:api    # http://localhost:4000/api/v1
npm run dev:web    # http://localhost:3000
```

Or on Windows: `npm run setup` then start both servers.

**Demo accounts:** `employer@beleqet.com` / `seeker@beleqet.com` — `Password123!`

---

## Deploy frontend (Vercel)

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Import Project** → select repo.
3. Set **Root Directory** to `frontend`.
4. Environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   ```
5. Deploy.

---

## Deploy backend (Render)

### Option A — Blueprint (recommended)

1. Render Dashboard → **New** → **Blueprint**.
2. Connect repo; Render reads `render.yaml` at repo root.
3. Set `FRONTEND_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`).
4. Add Redis (Render Redis or Upstash) and set `REDIS_HOST`.

### Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Runtime | Docker |
| Health check | `/api/v1/jobs/stats` |

**Required env vars:** `DATABASE_URL`, `REDIS_HOST`, `JWT_ACCESS_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

After deploy, run the seed once (Render shell or locally against prod DB):

```bash
cd backend && npm run prisma:seed
```

Update Vercel `NEXT_PUBLIC_API_URL` to the Render API URL.

---

## API

- Base: `http://localhost:4000/api/v1`
- Swagger (dev): `http://localhost:4000/api/docs`

## License

Private — interview / assessment project.
