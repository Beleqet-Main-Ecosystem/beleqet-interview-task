# Beleqet Jobs — Frontend

Next.js 14 app. Part of the monorepo at repo root.

## Local dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `.env.local`.

## Deploy (Vercel)

- **Root Directory:** `frontend`
- **Env:** `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`

See [root README](../README.md) for full deployment guide.
