# Beleqet Platform — Unified System Architecture

> Jobs Board + Freelance Marketplace (BeleqetSafe Escrow) — Event-Driven, TypeScript-First Stack  
> Prepared for: Henok Mekonnen / Beleqet Ecosystem  
> Stack: **Next.js · NestJS · PostgreSQL · Redis + BullMQ · OpenSearch**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Principles](#2-architecture-principles)
3. [High-Level System Diagram](#3-high-level-system-diagram)
4. [NestJS Module Map](#4-nestjs-module-map)
5. [Data Architecture (PostgreSQL)](#5-data-architecture-postgresql)
6. [Event-Driven Workflow Engine](#6-event-driven-workflow-engine)
7. [Caching Strategy (Redis)](#7-caching-strategy-redis)
8. [Search Architecture (OpenSearch)](#8-search-architecture-opensearch)
9. [API Layer](#9-api-layer)
10. [Frontend Architecture (Next.js)](#10-frontend-architecture-nextjs)
11. [Security & Compliance](#11-security--compliance)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [Phased Rollout](#13-phased-rollout)

---

## 1. Executive Summary

The framework choice matters, but the durable competitive advantage is the **event-driven workflow layer** underneath it.

This document locks in the stack specified — Next.js, NestJS, PostgreSQL, Redis + BullMQ, and OpenSearch — and shows exactly how the existing Beleqet Jobs frontend, the BeleqetSafe escrow specification, and a new Upwork-style freelance marketplace all sit on **one shared backend**, driven by a single event bus.

The freelance marketplace is not a separate product bolted onto Jobs. It reuses the same Users, Notifications, Search, and Payments infrastructure, and plugs into the same event bus that drives AI candidate screening, recruiter alerts, and analytics for the Jobs side.

> Building the event bus once, correctly, is what lets every future workflow (screening, escrow release, dispute handling, milestone payouts) become "just another listener" instead of a new system.

---

## 2. Architecture Principles

- **TypeScript end-to-end** — Next.js and NestJS share types via a generated OpenAPI client or a shared `packages/types` workspace, eliminating an entire class of integration bugs.

- **Modular monolith first, not microservices.** One NestJS app with strict module boundaries (Jobs, Freelance, Escrow, Wallet, Notifications, Search, Screening) ships faster, is easier to operate with a small team, and still lets you peel off a service later (e.g. Screening) without a rewrite — because the event bus already decouples them.

- **Every state change that matters to the business is an event, not just a database write.** Applying for a job, funding escrow, submitting a deliverable — each emits an event that other modules subscribe to independently.

- **PostgreSQL as the single source of truth** (ACID-correct money movement for escrow); **Redis as the fast/ephemeral layer** (cache, sessions, queues, rate limits); **OpenSearch** introduced only when Postgres full-text search and filtering genuinely become a bottleneck — not on day one.

- **SSR/ISR in Next.js** targeted specifically at what benefits from it: job/gig detail pages, category pages, employer profiles. Authenticated, interactive surfaces (dashboards, bid forms, wallet) stay client-rendered behind auth.

---

## 3. High-Level System Diagram

```
┌──────────────────────────────┐
│     Next.js (App Router)     │
│   Jobs UI + Freelance UI     │
│     SSR for SEO pages        │
└──────────────┬───────────────┘
               │  REST/JSON (OpenAPI)
               ▼
┌──────────────────────────────┐
│      NestJS API Gateway      │
│   Auth · Rate limit · DTO    │
└──────────────┬───────────────┘
       ┌───────┼───────────────┐
       ▼       ▼               ▼
┌────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Jobs     │ │   Freelance     │ │  Escrow &        │
│   Module   │ │   Module        │ │  Wallet Module   │
│(vacancies) │ │(gigs/bids/      │ │  (BeleqetSafe)   │
│            │ │ contracts)      │ │                  │
└─────┬──────┘ └────────┬────────┘ └────────┬─────────┘
      └─────────────────┼──────────────────-┘
                        ▼
          ┌─────────────────────────────┐
          │        PostgreSQL           │◄──► Redis + BullMQ
          │    (system of record)       │     Event bus / queues
          └─────────────────────────────┘     Cache · Sessions
                                                     │
                          ┌──────────────────────────┤
                          ▼           ▼              ▼
               ┌──────────────┐ ┌──────────┐ ┌─────────────┐
               │Notification  │ │    AI    │ │  Analytics  │
               │   Worker     │ │Screening │ │   Worker    │
               │(Telegram,    │ │  Worker  │ │(dashboards) │
               │ Email, Push) │ │          │ │             │
               └──────────────┘ └──────────┘ └─────────────┘

               ┌──────────────────────────┐
               │  OpenSearch (Phase 2+)   │
               │   Job/gig search index   │
               └──────────────────────────┘
```

---

## 4. NestJS Module Map

One NestJS application, organized as feature modules with explicit boundaries. Each module owns its own database tables and only talks to other modules through **events or well-defined service interfaces** — never by reaching into another module's repository directly.

| Module | Owns | Responsibility |
|---|---|---|
| `AuthModule` | users, sessions, roles | JWT auth, OTP/Telegram login, RBAC (job seeker, employer, freelancer, admin) |
| `JobsModule` | jobs, applications, categories | Vacancy CRUD, applications, the existing Beleqet Jobs feature set |
| `FreelanceModule` | freelance_jobs, bids, contracts, milestones | Gig posting, proposals, hiring, contract lifecycle |
| `EscrowModule` | escrow_transactions | BeleqetSafe — fund, hold, release, refund logic; payment gateway integration |
| `WalletModule` | freelancer_wallets, wallet_transactions | Freelancer balances, withdrawal requests, payout processing |
| `DisputesModule` | freelance_disputes | Dispute intake, admin resolution workflow |
| `NotificationsModule` | notifications | Fan-out to Telegram bot, email, web push — consumes events, doesn't emit business logic |
| `ScreeningModule` | candidate_scores | AI scoring for job applicants and freelance bids |
| `SearchModule` | — | OpenSearch indexing + query layer for jobs/gigs (Phase 2+) |
| `AnalyticsModule` | events_log, materialized views | Event sourcing log + dashboards for employers/admin |
| `ReferralsModule` | referrals, referral_rewards | Referral programme — generate links, reward pipeline, leaderboard |

---

## 5. Data Architecture (PostgreSQL)

The existing BeleqetSafe escrow specification (bids, contracts, milestones, wallets, disputes) maps directly onto PostgreSQL — swap AUTO_INCREMENT for UUID, ENUM columns for Postgres native enums, and JSON columns for JSONB (faster and indexable).

### 5.1 Shared / Identity

- **`users`** — single identity for job seekers, employers, freelancers, admins (role flags, not separate tables)
- **`companies`** — employer org profiles, used by both Jobs and Freelance postings
- **`notifications`** — unified inbox across Telegram, email, in-app

### 5.2 Jobs Domain

- `jobs`, `job_categories`, `applications` — existing vacancy board
- `candidate_scores` — AI scoring results per application

### 5.3 Freelance Domain

- `freelance_categories`, `freelance_jobs`, `bids` — gig posting and proposals
- `contracts`, `milestones`, `deliverables` — contract lifecycle and work submissions
- `escrow_transactions` — gross/fee/net amounts, status state machine, `gateway_response JSONB` for audit
- `freelancer_wallets`, `wallet_transactions` — pending vs available balance, 3-day hold logic
- `disputes` — evidence files, admin resolution

### 5.4 Referral Domain

- **`referrals`** — one row per code; tracks `referrerId`, `referredUserId`, `status`, `expiresAt`
- **`referral_rewards`** — one row per paid reward; links to `Referral` and `FreelancerWallet`

### 5.5 Event Sourcing

- **`events_log`** — append-only table mirroring every event published to BullMQ (`entity_id`, `event_type`, `payload JSONB`, `created_at`). Audit trail and source for analytics rebuilds / event replay.

> **Recommended ORM: Prisma** — its migration workflow and generated types pair cleanly with a TypeScript-first stack and a small team that needs to move fast without hand-writing migration SQL.

---

## 6. Event-Driven Workflow Engine

Every meaningful state change publishes a domain event onto a BullMQ queue. Workers subscribe independently — adding a new automated step (e.g. an AI re-screen, a new Telegram alert) means **adding a new listener, never touching the code that emitted the event**.

### 6.1 Hiring Workflow (Jobs side)

```
candidate.applied
  └─► screening.requested          (ScreeningModule consumes)
        └─► screening.completed
              └─► candidate.scored
                    ├─► recruiter.notified       (NotificationsModule)
                    ├─► interview.workflow.started  (if score > threshold)
                    └─► analytics.updated           (AnalyticsModule)
```

### 6.2 Freelance / Escrow Workflow (BeleqetSafe)

```
freelance_job.funded  (employer's Chapa payment confirmed via webhook)
  └─► freelance_job.published  (status: OPEN, visible in listings + search)

freelance_bid.submitted
  └─► employer.notified
  └─► bid.quality_scored        (ScreeningModule — flags low-quality/spam)

bid.accepted
  └─► contract.created
        └─► freelance_job.status = IN_PROGRESS
        └─► freelancer.notified

deliverable.submitted
  └─► employer.notified
  └─► escrow.status = IN_REVIEW

deliverable.approved  (manual, or auto after 14 days)
  └─► escrow.released
        ├─► wallet.credited_pending   (3-day hold starts)
        ├─► contract.status = COMPLETED
        └─► analytics.updated

dispute.raised
  └─► escrow.status = DISPUTED
  └─► admin.notified
  └─► analytics.updated
```

### 6.3 Referral Reward Pipeline

```
POST /referrals/apply
  └─► VALIDATE_REFERRAL             (checks referrer active, code still APPLIED)
        └─► (waits for application.offered event)
              └─► REWARD_REFERRER   (atomic $transaction)
                    ├─► FreelancerWallet.pendingBalance += 500 ETB
                    ├─► WalletTransaction (CREDIT_PENDING)
                    ├─► ReferralReward { status: PAID }
                    ├─► Referral → COMPLETED
                    └─► NOTIFY_REFERRAL
                          ├─► IN_APP notification → referrer
                          └─► Telegram (if connected) → referrer
```

### 6.4 BullMQ Queue Reference

| Queue | Producers | Consumers | Notes |
|---|---|---|---|
| `notifications` | all modules | NotificationsModule | Fan-out to Telegram, email, push; retries with backoff |
| `application-processing` | JobsModule | ScreeningModule | OpenAI scoring; idempotent by `applicationId` |
| `escrow` | EscrowModule webhook | EscrowModule, WalletModule | Payment gateway callbacks queued, not processed inline |
| `referrals` | ReferralsModule, event listeners | ReferralsProcessor | 4-step reward state machine with Redis dedup locks |
| `search-index` | JobsModule, FreelanceModule | SearchModule | Debounced reindex on create/update/delete |
| `analytics` | all modules | AnalyticsModule | Updates materialized views / dashboard aggregates |
| `scheduled` | cron (BullMQ repeatable) | EscrowModule, WalletModule, ReferralsModule | Auto-approve deliverables (14d); wallet hold release (3d); referral expiry sweep |
| `job-alerts` | scheduler | JobAlertsProcessor | Daily email digest matching active alert filters |

---

## 7. Caching Strategy (Redis)

| What | TTL / Pattern | Why |
|---|---|---|
| Session / JWT refresh tokens | Sliding, 7–30 days | Fast auth checks without hitting Postgres on every request |
| Job/gig listing pages (filtered) | 60–120s, stale-while-revalidate | Listing endpoints are read-heavy; short TTL keeps results fresh |
| Category & stats counters | 5 min, invalidated on write | Homepage stats don't need to be real-time per request |
| Rate limiting | Sliding window per user/IP | Protects bid submission, escrow, and auth endpoints from abuse |
| Referral dedup / idempotency keys | TTL = 90 days | Exactly-once guarantees on code claim and reward payout |
| Scheduler leader locks | TTL = 60s | One pod fires the sweep in a multi-replica deployment |
| BullMQ queues themselves | n/a — durable in Redis | Job state survives a worker restart |

---

## 8. Search Architecture (OpenSearch)

**Don't introduce OpenSearch on day one.** Postgres full-text search (`tsvector` / GIN index) comfortably handles tens of thousands of listings with simple keyword + filter queries.

Introduce OpenSearch when you need any of:

- Faceted search across many filters at once (category × location × budget × skill tags) with sub-100ms response at high listing volume
- Fuzzy/typo-tolerant matching for **Amharic + English** mixed queries
- Relevance ranking that blends recency, employer reputation, and bid competitiveness

When you do, the `SearchModule` indexes jobs and freelance_jobs into separate OpenSearch indices, kept in sync via the `search-index` BullMQ queue (not synchronous writes) — so search is always eventually-consistent but never blocks a write.

---

## 9. API Layer

NestJS exposes a single versioned REST API (`/api/v1`) documented with OpenAPI/Swagger, from which the Next.js frontend generates a typed client.

```
/api/v1/auth/*
/api/v1/jobs
/api/v1/jobs/:id/apply
/api/v1/freelance/jobs
/api/v1/freelance/jobs/:id/bids
/api/v1/freelance/bids/:id/accept
/api/v1/escrow/initiate
/api/v1/escrow/callback        ← webhook, no auth (Chapa signature-verified)
/api/v1/escrow/:jobId/release
/api/v1/wallet
/api/v1/wallet/withdraw
/api/v1/disputes
/api/v1/notifications
/api/v1/referrals/generate
/api/v1/referrals/apply
/api/v1/referrals/mine
/api/v1/referrals/leaderboard  ← public
```

The escrow webhook route is the **one deliberately unauthenticated endpoint** — verified instead by Chapa's HMAC signature header.

---

## 10. Frontend Architecture (Next.js)

**Rule of thumb:** anything a search engine or a cold visitor should see (listings, detail pages, public profiles) → **SSR/ISR**. Anything requiring login (dashboards, wallet, bidding, contract management) → **client-rendered behind auth** — no SEO benefit, and it keeps the server-rendered surface area small and fast.

```
app/
├── page.tsx                          Jobs homepage          (SSR/ISR)
├── jobs/[id]/page.tsx                Job detail             (SSR/ISR)
├── freelance/page.tsx                Browse gigs            (SSR/ISR)
├── freelance/[id]/page.tsx           Gig detail             (SSR/ISR)
├── freelance/post/page.tsx           Post a gig             (client, auth)
├── dashboard/
│   ├── employer/*                    Employer dashboard     (client, auth)
│   ├── freelancer/*                  Bids, contracts, wallet (client, auth)
│   └── admin/disputes/*              Dispute resolution     (client, auth)
└── auth/
    ├── register?ref=CODE             Referral code auto-applied at sign-up
    └── ...
```

---

## 11. Security & Compliance

- **Escrow funds never touch freelancer balances directly from a client request** — only `EscrowModule`, triggered by a verified gateway webhook or an authenticated employer-approval action, can transition `escrow_transactions.status`.

- All **money-moving endpoints** (escrow release, wallet withdrawal) require re-authentication or an OTP step, separate from the standard JWT session.

- **Rate limiting + CAPTCHA** on bid submission and job posting to prevent spam, scored further by `ScreeningModule`.

- **Row-level checks** in every module: a freelancer can only view their own bids/contracts; an employer can only view bids on their own jobs. Enforced in the service layer, not just the UI.

- **Gateway webhook payloads** (Chapa) are HMAC signature-verified and stored raw in `gateway_response JSONB` for audit/dispute resolution.

- **Referral system** uses Redis NX locks + BullMQ `jobId` deduplication + DB-level idempotency check to prevent any form of double-pay under concurrent requests or retry storms.

---

## 12. Infrastructure & Deployment

| Layer | Recommendation |
|---|---|
| Frontend | Vercel (Next.js) or containerized Next.js behind the same reverse proxy as the API |
| Backend | NestJS in Docker, deployed as a single service initially (Railway, Render, or VPS with Docker Compose) |
| Database | Managed PostgreSQL (Supabase, Neon, or RDS) with daily backups — non-negotiable given escrow handles real money |
| Redis | Managed Redis (Upstash, Redis Cloud) sized for BullMQ throughput, not just cache |
| Search | Managed OpenSearch (Bonsai, AWS OpenSearch) — Phase 2+ |
| Workers | Separate Node process(es) running BullMQ workers, scaled independently from the API |

---

## 13. Phased Rollout

| Phase | Scope |
|---|---|
| **Phase 1** ✅ | Next.js frontend with mock data — Jobs UI scaffold |
| **Phase 2** | NestJS + PostgreSQL: AuthModule, JobsModule, FreelanceModule (jobs, bids, contracts — no escrow yet, manual payment confirmation). Replace mock data with real API calls. |
| **Phase 3** | EscrowModule + WalletModule + Chapa integration, Redis + BullMQ event bus wired through Notifications. BeleqetSafe goes live. |
| **Phase 4** | ScreeningModule (AI scoring for applicants and bids) + AnalyticsModule dashboards + ReferralsModule — all as event consumers, no changes needed to Jobs/Freelance modules to add them. |
| **Phase 5** | Introduce OpenSearch once listing volume or filter complexity justifies it; split out workers/Screening as separate deployable services if load requires it. |
