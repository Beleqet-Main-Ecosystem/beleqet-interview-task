# Beleqet Platform — Full Project Plan

## Overview
Building the frontend for the Beleqet Platform (Jobs Board + Freelance Marketplace) by connecting the Next.js frontend to the NestJS backend API.

---

## Phase 1: Foundation

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 1.1 | Setup git workflow (main, develop, feature/*) | — | HIGH | ✅ |
| 1.2 | Create API client (`lib/api.ts`) | `feature/api-client` | HIGH | ✅ |
| 1.3 | Create auth context/provider | `feature/auth-context` | HIGH | ✅ |
| 1.4 | Build Login page | `feature/auth-login` | HIGH | ✅ |
| 1.5 | Build Register page | `feature/auth-register` | HIGH | ✅ |
| 1.6 | Add token refresh + auto-logout | `feature/auth-protect` | HIGH | ✅ |
| 1.7 | Add ProtectedRoute component | `feature/auth-protect` | HIGH | ✅ |
| 1.8 | Add RoleGate component | `feature/auth-protect` | HIGH | ✅ |

---

## Phase 2: Jobs (Connect to Real API)

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 2.1 | Connect Jobs listing to API | `feature/jobs-api` | HIGH | ⏳ |
| 2.2 | Connect Job detail to API | `feature/job-detail-api` | HIGH | ⏳ |
| 2.3 | Connect Job search/filter to API | `feature/jobs-search` | HIGH | ⏳ |
| 2.4 | Build Post Job page (Employer) | `feature/post-job` | MEDIUM | ⏳ |
| 2.5 | Build Job Categories component | `feature/job-categories` | MEDIUM | ⏳ |

---

## Phase 3: Applications

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 3.1 | Build Apply to Job form | `feature/apply-job` | HIGH | ⏳ |
| 3.2 | Build My Applications page (Job Seeker) | `feature/my-applications` | MEDIUM | ⏳ |
| 3.3 | Build Applicant List (Employer view) | `feature/applicant-list` | MEDIUM | ⏳ |

---

## Phase 4: Freelance

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 4.1 | Browse Gigs page | `feature/freelance-browse` | MEDIUM | ⏳ |
| 4.2 | Gig detail page | `feature/freelance-detail` | MEDIUM | ⏳ |
| 4.3 | Post a Gig page | `feature/freelance-post` | MEDIUM | ⏳ |
| 4.4 | Submit Bid form | `feature/freelance-bid` | MEDIUM | ⏳ |
| 4.5 | My Bids page (Freelancer) | `feature/my-bids` | MEDIUM | ⏳ |
| 4.6 | Contract view | `feature/contract-view` | MEDIUM | ⏳ |
| 4.7 | Milestone tracking | `feature/milestones` | LOW | ⏳ |

---

## Phase 5: Dashboards

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 5.1 | Employer Dashboard | `feature/dashboard-employer` | MEDIUM | ⏳ |
| 5.2 | Freelancer Dashboard | `feature/dashboard-freelancer` | MEDIUM | ⏳ |
| 5.3 | Admin Dashboard | `feature/dashboard-admin` | LOW | ⏳ |
| 5.4 | Notifications center | `feature/notifications` | MEDIUM | ⏳ |

---

## Phase 6: Escrow & Wallet (BeleqetSafe)

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 6.1 | Wallet page | `feature/wallet` | MEDIUM | ⏳ |
| 6.2 | Escrow flow UI | `feature/escrow` | LOW | ⏳ |
| 6.3 | Withdrawal request form | `feature/withdrawal` | LOW | ⏳ |
| 6.4 | Transaction history | `feature/transactions` | LOW | ⏳ |

---

## Phase 7: Disputes

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 7.1 | Raise dispute form | `feature/dispute-raise` | LOW | ⏳ |
| 7.2 | Admin dispute resolution | `feature/dispute-admin` | LOW | ⏳ |

---

## Phase 8: Polish & Testing

| # | Task | Branch | Priority | Status |
|---|------|--------|----------|--------|
| 8.1 | Error handling & loading states | `feature/ui-polish` | MEDIUM | ⏳ |
| 8.2 | Responsive testing | `feature/responsive` | MEDIUM | ⏳ |
| 8.3 | Final E2E testing | `fix/final-testing` | HIGH | ⏳ |

---

## Current Status

| Phase | Tasks | Completed |
|-------|-------|-----------|
| Phase 1: Foundation | 8 | 8 |
| Phase 2: Jobs | 5 | 0 |
| Phase 3: Applications | 3 | 0 |
| Phase 4: Freelance | 7 | 0 |
| Phase 5: Dashboards | 4 | 0 |
| Phase 6: Escrow & Wallet | 4 | 0 |
| Phase 7: Disputes | 2 | 0 |
| Phase 8: Polish & Testing | 3 | 0 |
| **Total** | **36** | **8** |

---

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
