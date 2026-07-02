# Beleqet Interview Task — Context

## The Job
- **Position:** Full-Stack Developer & Technical Lead
- **Company:** Beleqet Ecosystem (Ethiopian hiring & freelance platform)
- **Assessment:** Run, verify, and demonstrate the existing codebase

## Assessment Task
1. Fork the repo from GitHub: https://github.com/Beleqet-Main-Ecosystem/beleqet-interview-task
2. Run `docker compose up` in the `backend/` directory
3. Verify API works at `http://localhost:4000/api/v1`
4. Send back GitHub repository link

## Project Overview
**Beleqet Platform** — A unified Jobs Board + Freelance Marketplace with escrow payments (BeleqetSafe).

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | NestJS 10 (Express 5) + TypeScript |
| Database | PostgreSQL 15 (Prisma ORM) |
| Cache/Queue | Redis 7 + BullMQ |
| AI | OpenAI SDK (gpt-4o-mini) |
| Payments | Chapa (Ethiopian gateway) + Telebirr |
| Real-time | Socket.IO (chat) |
| Search | OpenSearch (Phase 2 — stub only) |

### Architecture
- **Modular monolith** — 16 feature modules in one NestJS app
- **Event-driven** — state changes emit events, workers subscribe independently
- **Dual event system:** BullMQ (cross-process) + EventEmitter2 (in-process)

## Project Structure
```
beleqet-interview-task/
├── backend/                    # NestJS API (the main focus)
│   ├── docker-compose.yml      # Postgres + Redis + Backend
│   ├── Dockerfile              # Multi-stage production build
│   ├── .env.example            # Environment template
│   ├── prisma/
│   │   ├── schema.prisma       # 19 models, 12 enums
│   │   └── seed.ts             # 54 job categories + 5 freelance categories
│   └── src/
│       ├── main.ts             # Bootstrap
│       ├── app.module.ts       # Root module
│       ├── common/             # Guards, decorators, filters, pipes
│       └── modules/
│           ├── auth/           # JWT register/login/refresh
│           ├── users/          # Profile, company, notifications
│           ├── jobs/           # Job CRUD, search, categories
│           ├── applications/   # Submit → triggers AI workflow
│           ├── screening/      # BullMQ: OpenAI scoring
│           ├── notifications/  # BullMQ: Telegram/in-app/email
│           ├── analytics/      # BullMQ: event logging
│           ├── freelance/      # Gigs, bids, contracts, milestones
│           ├── escrow/         # Chapa integration, auto-release
│           ├── wallet/         # Balance, withdrawals
│           ├── chat/           # WebSocket gateway
│           ├── admin/          # Admin endpoints
│           ├── uploads/        # AWS S3 presigned URLs
│           ├── telegram/       # Telegram bot listener
│           ├── search/         # OpenSearch stub (Phase 2)
│           └── queues/         # Queue name constants
├── beleqet-jobs-nextjs/        # Next.js Frontend (mock data, no API connection yet)
└── Beleqet_System_Architecture.docx
```

## Key Commands
```bash
# From backend/ directory:
docker compose up              # Start all containers
npm run start:dev              # Dev mode with hot reload
npm run build                  # Compile TypeScript
npm run prisma:generate        # Regenerate Prisma client
npm run prisma:migrate         # Run migrations
npm run prisma:seed            # Seed demo data
npm run test                   # Run unit tests
```

## API Endpoints
- **Base URL:** http://localhost:4000/api/v1
- **Swagger Docs:** http://localhost:4000/api/docs

### Main Routes
| Route | Purpose |
|-------|---------|
| `POST /auth/register` | Register (JOB_SEEKER, EMPLOYER, FREELANCER) |
| `POST /auth/login` | Login → returns access + refresh tokens |
| `GET /jobs` | List jobs (public, paginated) |
| `POST /jobs` | Create job (EMPLOYER only) |
| `POST /applications` | Submit application → triggers AI screening |
| `GET /freelance/jobs` | List freelance gigs (public) |
| `POST /freelance/jobs/:id/bids` | Submit bid on gig |
| `POST /escrow/initiate/:gigId` | Start escrow payment |
| `POST /escrow/callback` | Chapa webhook (no auth) |
| `GET /wallet` | View wallet balance |

## Environment Variables (from docker-compose.yml)
| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | postgresql://beleqet_user:your_password@db:5432/beleqet_db | PostgreSQL |
| `REDIS_HOST` | redis | Redis |
| `JWT_ACCESS_SECRET` | docker_default_secret_please_change_in_production | Change in prod |
| `OPENAI_API_KEY` | dummy_key_for_testing | AI screening (neutral fallback) |
| `CHAPA_SECRET_KEY` | (not set) | Payments — needs real key |
| `TELEGRAM_BOT_TOKEN` | (not set) | Notifications — needs real token |

## Event-Driven Workflows

### Job Application Flow
```
POST /applications
  → Application { status: SUBMITTED }
  → Queue: screen-candidate (ScreeningProcessor)
    → OpenAI scores cover letter (0-100)
    → Application → SHORTLISTED | REJECTED
    → Queue: send-in-app (candidate)
    → Queue: send-telegram (recruiter)
    → Queue: log-platform-event
```

### Escrow Flow
```
POST /escrow/initiate/:gigId
  → Chapa checkout URL
POST /escrow/callback (webhook)
  → EscrowTransaction { status: FUNDED }
  → FreelanceJob { status: FUNDED }
  → Queue: notify-client
```

## Current Status (Updated 2026-07-02)
- ✅ Backend is feature-complete (all modules built)
- ✅ Frontend scaffold exists (Next.js with mock data)
- ✅ Docker Compose running (Postgres + Redis + Backend)
- ✅ API verified at http://localhost:4000/api/v1
- ✅ Swagger UI verified at http://localhost:4000/api/docs
- ✅ Endpoints tested: GET /jobs, GET /freelance/jobs, GET /api/docs
- ✅ Frontend connected to real API (Jobs listing, Job detail, Featured jobs)
- ✅ Auth system complete (Login, Register, Profile, Email verification)
- ✅ Auth hydration now uses `/users/profile` so profile state includes `emailVerified`
- ✅ Database seeded (54 job categories, 5 freelance categories)
- ❌ Jobs table empty (needs employer to create jobs)
- ❌ Freelance section not built yet
- ❌ Dashboards not built yet
- ❌ Escrow/Wallet UI not built yet

## Assessment Task Status
| Step | Status | Notes |
|------|--------|-------|
| 1. Fork repo | ✅ Done | GitHub repo cloned |
| 2. Run docker compose up | ✅ Done | All 3 containers running |
| 3. Verify API at :4000/api/v1 | ✅ Done | Endpoints respond correctly |
| 4. Send GitHub link | ⏳ Pending | Need to push fork to GitHub |

## What Was Verified
```
Container          Status    Notes
beleqet-postgres   ✅ Running  Prisma connected to PostgreSQL
beleqet-redis      ✅ Running  Queue system ready
beleqet-backend    ✅ Running  API on port 4000

Endpoint                          Status  Result
GET /api/v1/jobs                  200     Empty array (DB connected)
GET /api/v1/freelance/jobs        200     Empty array (DB connected)
GET /api/docs                     200     Swagger UI loads

Frontend
Service         Status    URL
beleqet-nextjs  ✅ Running  http://localhost:3000
.env.local      ✅ Set      NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

Database
Table           Rows  Notes
users           5     Registered users
jobs            0     Empty (no jobs yet)
job_categories  54    Seeded
freelance_categories 5 Seeded
```

## What to Do Next
1. ~~Run `docker compose up` from `backend/` directory~~ DONE
2. ~~Verify containers start: Postgres, Redis, Backend~~ DONE
3. ~~Check API at http://localhost:4000/api/v1~~ DONE
4. Test endpoints via Swagger at http://localhost:4000/api/docs (USER ACTION)
5. Register a user, login, try creating jobs/applications (USER ACTION)
6. Push fork to GitHub and send link (USER ACTION)

## Frontend Status (beleqet-jobs-nextjs/)
| Page/Component | Status | Notes |
|----------------|--------|-------|
| Home page | ✅ Mock data | Hero, Stats, Categories, Featured Jobs |
| Jobs listing | ✅ Mock data | Search, filters |
| Job detail | ✅ Mock data | Single job view |
| Header/Footer | ✅ | Navigation |
| About, Contact, CV Maker, Pricing | ✅ Scaffolds | Basic pages |
| npm audit | ✅ Fixed | Upgraded next@16, eslint-config-next@16 (2 moderate remaining) |
| API client (lib/api.ts) | ❌ Not started | Needs fetch wrapper |
| Auth pages | ❌ Not started | Login/Register |
| Freelance section | ❌ Not started | Gigs, bidding |
| Dashboards | ❌ Not started | Employer, Freelancer, Admin |

## Architecture (from System Architecture Doc)

### Module Map
| Module | Tables | Responsibility |
|--------|--------|----------------|
| AuthModule | users, sessions, roles | JWT auth, RBAC |
| JobsModule | jobs, applications, categories | Vacancy CRUD |
| FreelanceModule | freelance_jobs, bids, contracts, milestones | Gig lifecycle |
| EscrowModule | escrow_transactions | BeleqetSafe payments |
| WalletModule | freelancer_wallets, wallet_transactions | Balances, withdrawals |
| NotificationsModule | notifications | Telegram, email, push |
| ScreeningModule | candidate_scores | AI scoring |

### Event-Driven Workflows
```
candidate.applied → screening.requested → screening.completed → candidate.scored
freelance_bid.submitted → employer.notified → bid.quality_scored
deliverable.approved → escrow.released → wallet.credited_pending
```

### API Routes
```
/api/v1/auth/*
/api/v1/jobs
/api/v1/freelance/jobs
/api/v1/escrow/initiate
/api/v1/wallet
/api/v1/disputes
/api/v1/notifications
```

### Frontend Structure (from Architecture Doc)
```
app/
  page.tsx                    Jobs homepage (SSR)
  jobs/[id]/page.tsx          Job detail (SSR)
  freelance/page.tsx          Browse gigs (SSR)
  freelance/[id]/page.tsx     Gig detail (SSR)
  freelance/post/page.tsx     Post gig (client, auth)
  dashboard/employer/*        Employer dashboard (client, auth)
  dashboard/freelancer/*      Freelancer dashboard (client, auth)
  dashboard/admin/disputes/*  Admin disputes (client, auth)
```

## Notes
- The project is "plug-and-play" — docker handles everything
- No real API keys needed for basic testing (AI falls back gracefully)
- The frontend is separate and still uses mock data
- Swagger docs auto-generated at /api/docs (non-production only)
- Full project plan saved in `plan.md` (23 tasks across 7 phases)
- Git workflow: main → develop → feature/* branches
- Auth system: login, register, token refresh, protected routes, role gates

## Rules
- **DO NOT run commands unless explicitly told to.** Wait for user to say "run it" or similar.
- Explain first, then let the user run commands themselves or explicitly ask me to run them.
- When something important is learned, save to `learn.md`
- When project status changes, update `context.md`
