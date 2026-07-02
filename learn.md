# Beleqet Interview Task — Learn Log

This file documents everything we learn as we work through the project. Each entry includes the concept, why it matters, and how it connects to what we already know.

---

## Current Status (Updated 2026-07-02)

### What's Running
- ✅ Backend API: http://localhost:4000/api/v1 (Docker)
- ✅ Frontend: http://localhost:3000 (npm run dev)
- ✅ PostgreSQL + Redis: Running in Docker

### What's Built (Frontend)
| Module | Pages | Status |
|--------|-------|--------|
| Auth | Login, Register, Forgot Password, Reset Password, Verify Email, Profile, Edit Profile | ✅ Done |
| Jobs | Jobs listing (API connected), Job detail (API connected), Featured jobs (API connected) | ✅ Done |
| Freelance | — | ❌ Not started |
| Dashboards | — | ❌ Not started |
| Escrow/Wallet | — | ❌ Not started |

### What's Left to Build
| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 2: Jobs | Post Job page, Job Categories | MEDIUM |
| Phase 3: Applications | Apply form, My Applications, Applicant List | HIGH |
| Phase 4: Freelance | Browse Gigs, Gig Detail, Post Gig, Bids, Contracts | MEDIUM |
| Phase 5: Dashboards | Employer, Freelancer, Admin | MEDIUM |
| Phase 6: Escrow/Wallet | Wallet, Escrow flow, Withdrawal, Transactions | LOW |
| Phase 7: Disputes | Raise Dispute, Admin Resolution | LOW |
| Phase 8: Polish | Error handling, Responsive, E2E testing | HIGH |

### Git Status
- Current branch: `main`
- Last commit: `feat: add email verification flow with banner`
- Remote: https://github.com/bilalshemsu1/beleqet-interview-task

### How to Start Next Time
1. Read this file (learn.md) — understand current status
2. Read context.md — understand the project
3. Read plan.md — see what's left to build
4. Run `docker compose up -d` in `backend/` — start API
5. Run `npm run dev` in `beleqet-jobs-nextjs/` — start frontend
6. Continue building from the next unfinished task

### Key Files
| File | Purpose |
|------|---------|
| `context.md` | Project overview, architecture, assessment status |
| `plan.md` | Full project plan (36 tasks across 8 phases) |
| `learn.md` | This file — learning log + current status |
| `beleqet-jobs-nextjs/lib/api.ts` | API client for backend |
| `beleqet-jobs-nextjs/lib/auth-context.tsx` | Auth state management |
| `beleqet-jobs-nextjs/lib/types.ts` | TypeScript types |
| `beleqet-jobs-nextjs/components/ProtectedRoute.tsx` | Auth guard |
| `beleqet-jobs-nextjs/components/RoleGate.tsx` | Role-based access |

### Auth Contract Note
- Frontend auth hydration should use `GET /users/profile`, not `GET /auth/me`, because `/auth/me` only returns JWT identity fields (`userId`, `email`, `role`).
- The profile payload must include `emailVerified` so the email verification banner and auth state stay accurate after refresh.

---

## Workflow Pattern

For every task we follow:
1. **LEARN** — Understand the concept before doing anything
2. **DO** — Execute the task
3. **CHECK** — Verify it works correctly
4. **DONE** — Move to the next task

---

## Learning Index

| # | Topic | Section | Status |
|---|-------|---------|--------|
| 01 | NestJS Basics | [NestJS Fundamentals](#01-nestjs-fundamentals) | ✅ Done |
| 02 | Docker & Containers | [Docker Basics](#02-docker--containers) | ✅ Done |
| 03 | PostgreSQL & Prisma | [Database Layer](#03-postgresql--prisma) | Pending |
| 04 | NestJS Modules | [Module System](#04-nestjs-modules) | Pending |
| 05 | Guards & Auth | [Authentication](#05-guards--authentication) | Pending |
| 06 | BullMQ & Queues | [Background Jobs](#06-bullmq--queues) | Pending |
| 07 | WebSocket & Chat | [Real-time](#07-websocket--chat) | Pending |
| 08 | Running the Frontend | [Frontend Setup](#08-running-the-frontend) | ✅ Done |
| 09 | Git Workflow | [Git & Branch Protection](#09-git-workflow--branch-protection) | ✅ Done |
| 10 | Auth System | [Full Stack Auth](#10-authentication-system-full-stack) | ✅ Done |
| 11 | Database Access | [Database & Seeding](#11-database-access--seeding) | ✅ Done |

---

## 01. NestJS Fundamentals

> **Status:** ✅ Learned
> **When:** Task 1 — Before `docker compose up`

### What We Learned
NestJS = Laravel's equivalent for TypeScript/Node.js. It gives structure to Node.js backends the same way Laravel structures PHP backends.

### Laravel ↔ NestJS Comparison

| Laravel | NestJS | Purpose |
|---------|--------|---------|
| Service Provider | Module | Registers and wires dependencies |
| Controller | Controller | Handles HTTP requests |
| Service Class | Service | Business logic |
| Middleware | Guard | Checks auth/roles before request reaches controller |
| Artisan CLI | NestJS CLI | Generate files (`nest g controller jobs`) |
| `.env` | `.env` | Environment config |
| Eloquent | Prisma | Database ORM |
| Queue (Redis) | BullMQ | Background job processing |
| Events/Broadcasting | EventEmitter2 + BullMQ | Event-driven architecture |

### Core Concepts

#### 1. Controllers (Routes)
```php
// Laravel
class JobController extends Controller {
    public function index() { return Job::all(); }
}
```
```typescript
// NestJS
@Controller('jobs')
export class JobsController {
  @Get()
  findAll() { return this.jobsService.findAll(); }
}
```

#### 2. Services (Business Logic)
```php
// Laravel
class JobService {
    public function getAll() { return Job::all(); }
}
```
```typescript
// NestJS
@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}
  async findAll() { return this.prisma.job.findMany(); }
}
```

#### 3. Dependency Injection
```php
// Laravel — type-hint in constructor
class JobController extends Controller {
    public function __construct(JobService $jobService) {}
}
```
```typescript
// NestJS — same concept, needs @Injectable() decorator
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
}
```

#### 4. Decorators (NestJS-specific)

| NestJS Decorator | Laravel Equivalent |
|------------------|--------------------|
| `@Controller('jobs')` | `Route::prefix('jobs')` |
| `@Get()` | `Route::get('/', ...)` |
| `@Post()` | `Route::post('/', ...)` |
| `@Injectable()` | `App::bind()` — marks class as resolvable |
| `@InjectQueue('notifications')` | `$this->dispatch(new SendNotification())` |
| `@Roles('EMPLOYER')` | `$this->middleware('role:employer')` |
| `@CurrentUser()` | `auth()->user()` |
| `@Param('id')` | `$request->route('id')` |

#### 5. How the App Starts
```php
// Laravel: php artisan serve
```
```typescript
// NestJS: npm run start:dev
// main.ts is like bootstrap/app.php
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');     // Route::prefix('api/v1')
  app.use(helmet());                  // Middleware
  await app.listen(4000);             // artisan serve --port=4000
}
```

### Key Files in This Project
- `src/main.ts` — Bootstrap (like `bootstrap/app.php`)
- `src/app.module.ts` — Root module (like `AppServiceProvider` + `config/app.php`)
- `src/modules/auth/auth.service.ts` — Auth logic (like `AuthServiceProvider`)

### Checklist
- [x] Controllers handle HTTP requests (like Laravel Controllers)
- [x] Services hold business logic (like Laravel Service classes)
- [x] Dependency Injection = constructor injection (same as Laravel)
- [x] `@Injectable()` = marks class as resolvable from container
- [x] `AppModule` = root module (wires everything together)
- [x] `main.ts` = bootstrap file (like `bootstrap/app.php`)
- [x] Prisma = Eloquent equivalent (ORM)
- [x] BullMQ = Laravel Queue (background jobs)
- [x] Guards = Middleware (auth checks)

---

## 02. Docker & Containers

> **Status:** ✅ Learned
> **When:** Task 2 — Running `docker compose up`

### What We Learned
Docker = A way to run apps in isolated containers. Like Homestead/Valet but more portable.

### Laravel ↔ Docker Comparison

| Laravel Setup | Docker Equivalent |
|---------------|-------------------|
| Homestead / Valet | Docker Desktop |
| `docker-compose.yml` | `Homestead.yaml` — defines services |
| MySQL in Homestead | `postgres:15-alpine` container |
| Redis in Homestead | `redis:7-alpine` container |
| `php artisan serve` | Backend container running NestJS |
| `.env` | Environment variables in docker-compose.yml |

### docker-compose.yml Breakdown

**PostgreSQL Service:**
```yaml
db:
  image: postgres:15-alpine        # Use PostgreSQL 15 (Alpine = lightweight)
  environment:
    POSTGRES_USER: beleqet_user    # DB_USERNAME in Laravel
    POSTGRES_PASSWORD: your_password  # DB_PASSWORD
    POSTGRES_DB: beleqet_db        # DB_DATABASE
  ports:
    - "5432:5432"                  # Expose port to your computer
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Save data permanently
```

**Redis Service:**
```yaml
redis:
  image: redis:7-alpine           # Use Redis 7
  ports:
    - "6379:6379"                 # Expose Redis port
  volumes:
    - redis_data:/data            # Save data permanently
```

**Backend Service (NestJS):**
```yaml
backend:
  build:
    context: .                    # Build from Dockerfile
    dockerfile: Dockerfile
  ports:
    - "4000:4000"                 # API runs on port 4000
  environment:
    - DATABASE_URL=postgresql://beleqet_user:your_password@db:5432/beleqet_db
    - REDIS_HOST=redis            # Container name resolves to IP
    - JWT_ACCESS_SECRET=docker_default_secret_please_change_in_production
    - OPENAI_API_KEY=dummy_key_for_testing
  depends_on:
    - db                          # Start DB first
    - redis                       # Start Redis first
```

### Dockerfile Breakdown (Two-Stage Build)

**Stage 1: Build** (Like `composer install` + `npm run build`)
```dockerfile
FROM node:20-alpine AS builder    # Start with Node.js 20
WORKDIR /app                      # cd /app
RUN apk add --no-cache openssl    # Install OpenSSL (for JWT)
COPY package*.json ./             # Copy package files
COPY prisma ./prisma/             # Copy schema
RUN npm ci                        # Install dependencies (like composer install)
COPY . .                          # Copy source code
RUN npm run prisma:generate       # Generate Prisma client
RUN npm run build                 # Compile TypeScript
```

**Stage 2: Production** (Lightweight final image)
```dockerfile
FROM node:20-alpine               # Fresh Node.js image
COPY --from=builder /app/dist ./dist      # Only compiled JS
COPY --from=builder /app/prisma ./prisma  # Schema files
CMD sh -c "npx prisma db push --accept-data-loss && npm run start:prod"
# Push schema to DB, then start API
```

### Key Concepts

**Container Names = Hostnames in Docker Network:**
- `db` → PostgreSQL container
- `redis` → Redis container
- `backend` → NestJS container

**Volumes (Data Persistence):**
- Without volumes, data disappears when containers restart
- `postgres_data` and `redis_data` save data permanently

**depends_on (Startup Order):**
- `backend` depends on `db` and `redis`
- Docker starts DB and Redis BEFORE starting backend

**CMD (What Runs When Container Starts):**
```dockerfile
CMD sh -c "npx prisma db push --accept-data-loss && npm run start:prod"
```
- `prisma db push` = Push schema to database (like `php artisan migrate`)
- `npm run start:prod` = Start API server (like `php artisan serve`)

### Checklist
- [x] Docker Compose = defines multiple services (like Homestead.yaml)
- [x] `docker compose up -d` = starts all containers in background
- [x] Container names = hostnames in Docker network
- [x] Volumes = save data permanently
- [x] `depends_on` = control startup order
- [x] Dockerfile = recipe to build container image
- [x] Two-stage build = smaller production images
- [x] `CMD` = what runs when container starts

---

## 03. PostgreSQL & Prisma

> **Status:** Pending
> **When:** First time checking the database

### What to Learn
- What Prisma is (ORM for TypeScript)
- How schema.prisma defines the database
- How to view data with Prisma Studio

### Why It Matters
Prisma is how the backend talks to PostgreSQL. All data flows through it.

---

## 04. NestJS Modules

> **Status:** Pending
> **When:** Exploring the backend code

### What to Learn
- How the 16 feature modules are organized
- How modules communicate with each other
- What `app.module.ts` does (root module)

### Why It Matters
Understanding the module map helps you navigate the codebase and find what you need.

---

## 05. Guards & Authentication

> **Status:** Pending
> **When:** Testing login/register endpoints

### What to Learn
- JWT (JSON Web Tokens) — access + refresh tokens
- How `@Roles()` decorator works
- How `JwtAuthGuard` protects routes

### Why It Matters
Almost every endpoint requires authentication. You need to understand how tokens work.

---

## 06. BullMQ & Queues

> **Status:** Pending
> **When:** Testing application submission (triggers AI workflow)

### What to Learn
- What BullMQ is (job queue backed by Redis)
- How the screening workflow runs in background
- How to check queue status and logs

### Why It Matters
The event-driven architecture is the core of the platform. Understanding queues helps you trace what happens when actions occur.

---

## 07. WebSocket & Chat

> **Status:** Pending
> **When:** Exploring the chat module

### What to Learn
- What Socket.IO is
- How the ChatGateway works
- How WebSocket connections are authenticated

### Why It Matters
Real-time chat is a key feature. Understanding it helps you see how NestJS handles non-HTTP connections.

---

## 08. Running the Frontend

> **Status:** ✅ Learned
> **When:** After npm audit fix

### What We Learned
How to run the Next.js frontend and connect it to the backend API.

### Laravel ↔ Next.js Comparison

| Laravel | Next.js | Purpose |
|---------|---------|---------|
| `php artisan serve` | `npm run dev` | Start dev server |
| `resources/views/` | `app/` (App Router) | Pages/templates |
| Blade components | React components | Reusable UI pieces |
| Routes (web.php) | File-based routing | URL → page mapping |
| Vite/Mix | Turbopack (built-in) | Asset bundling |
| `.env` | `.env.local` | Environment config |

### Key Commands

```bash
# From beleqet-jobs-nextjs/ directory:
npm run dev          # Start dev server (like php artisan serve)
npm run build        # Compile for production
npm start            # Run production build
npm run lint         # Check code quality
```

### How It Works

**Dev Server:**
```bash
npm run dev
# Starts on http://localhost:3000
# Hot reload — changes appear instantly
```

**File-Based Routing (App Router):**
```
app/
  page.tsx              → /
  jobs/page.tsx         → /jobs
  jobs/[id]/page.tsx    → /jobs/123
  login/page.tsx        → /login
```

**Components:**
```
components/
  Header.tsx            → Navigation bar
  Footer.tsx            → Footer
  Hero.tsx              → Homepage hero section
  JobCard.tsx           → Single job card
  JobsListing.tsx       → Jobs list with filters
```

### Environment Variables

Create `.env.local` in `beleqet-jobs-nextjs/`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

This tells the frontend where the backend API is.

### Running Both Services

You need **two terminals**:

**Terminal 1 — Backend (Docker):**
```bash
cd backend
docker compose up -d
# API runs on http://localhost:4000
```

**Terminal 2 — Frontend (Next.js):**
```bash
cd beleqet-jobs-nextjs
npm run dev
# Frontend runs on http://localhost:3000
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | Run `npm run dev -- -p 3001` |
| Cannot connect to API | Check `docker compose ps` — backend must be running |
| Tailwind styles not working | Run `npm run build` then `npm run dev` |
| Module not found errors | Run `npm install` again |

### Checklist
- [x] `npm install` installs dependencies
- [x] `npm run dev` starts dev server on :3000
- [x] `npm run build` compiles for production
- [x] File-based routing = pages in `app/` directory
- [x] Components live in `components/` directory
- [x] `.env.local` for environment variables
- [x] Two terminals needed: backend (Docker) + frontend (Next.js)

---

## 09. Git Workflow & Branch Protection

> **Status:** ✅ Learned
> **When:** Setting up project for development

### What We Learned
Senior-level Git workflow with branch protection rules.

### Branch Structure
```
main (protected — no direct pushes)
  └── develop (integration branch)
       ├── feature/api-client
       ├── feature/auth-login
       ├── ...
       └── feature/freelance-browse
```

### Branch Protection Rules (GitHub)
1. Go to repo → **Settings** → **Branches**
2. Add rule for `main`:
   - ✅ Require pull request before merging
   - ✅ Require approvals (1 reviewer)
   - ✅ Require conversation resolution
   - ✅ Do not allow bypassing

### Git Commands
```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Create feature branch
git checkout develop
git pull
git checkout -b feature/api-client

# Work on feature
git add .
git commit -m "feat: add API client"

# Push feature branch
git push -u origin feature/api-client

# Create PR on GitHub: feature/* → develop
```

### Commit Convention
```
feat:     new feature
fix:      bug fix
chore:    maintenance
docs:     documentation
style:    formatting
refactor: code restructuring
test:     adding tests
```

### Checklist
- [x] Branch protection on `main`
- [x] `develop` branch created
- [x] Feature branches from `develop`
- [x] PRs required for all merges
- [x] Commit messages follow convention

---

## 10. Authentication System (Full Stack)

> **Status:** ✅ Learned
> **When:** Building auth pages

### What We Learned
Complete authentication system with JWT tokens, protected routes, and role-based access.

### Laravel ↔ Next.js Auth Comparison

| Laravel | Next.js | Purpose |
|---------|---------|---------|
| `auth.php` config | `lib/auth-context.tsx` | Auth configuration |
| `Auth::user()` | `useAuth().user` | Get current user |
| `auth()->login()` | `login(email, password)` | Sign in |
| `auth()->logout()` | `logout()` | Sign out |
| `middleware('auth')` | `<ProtectedRoute>` | Require login |
| `middleware('role:admin')` | `<RoleGate>` | Require role |
| Password reset routes | `/forgot-password`, `/reset-password` | Reset flow |

### Auth Flow Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Register   │────▶│   Login     │────▶│   Dashboard │
│  /register   │     │   /login    │     │  /dashboard │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
  POST /auth/register  POST /auth/login    GET /auth/me
       │                   │                    │
       ▼                   ▼                    ▼
  { accessToken }      { accessToken }      { user data }
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                    localStorage token
                           │
                    ┌──────┴──────┐
                    │  Auto-logout │
                    │  on expiry   │
                    └─────────────┘
```

### Key Components

**1. Auth Context (`lib/auth-context.tsx`)**
```tsx
// Provides: user, token, isLoading, login, register, logout, refreshUser
const { user, token, login, logout } = useAuth();
```

**2. Protected Route (`components/ProtectedRoute.tsx`)**
```tsx
// Redirects to /login if not authenticated
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

**3. Role Gate (`components/RoleGate.tsx`)**
```tsx
// Shows access denied if wrong role
<RoleGate allowedRoles={["EMPLOYER", "ADMIN"]}>
  <PostJobPage />
</RoleGate>
```

### Token Management
- **Storage:** localStorage (simple, works for SSR)
- **Expiration:** Checked via JWT `exp` claim
- **Auto-logout:** 1 minute before expiry
- **Refresh:** Fetches fresh user data from API

### Backend Auth Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Get tokens |
| `/auth/refresh` | POST | Refresh token |
| `/auth/logout` | POST | Invalidate token |
| `/auth/me` | GET | Get current user |
| `/auth/forgot-password` | POST | Send reset email |
| `/auth/reset-password` | POST | Reset password |
| `/auth/verify-email` | POST | Verify email |

### Pages Built
| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | Sign in form |
| Register | `/register` | Create account |
| Forgot Password | `/forgot-password` | Request reset link |
| Reset Password | `/reset-password?token=xxx` | Set new password |
| Verify Email | `/verify-email?token=xxx` | Confirm email |
| Profile | `/dashboard/profile` | View profile |
| Edit Profile | `/dashboard/profile/edit` | Update profile |

### Security Notes
- JWT tokens are stateless (no server session)
- Passwords hashed on backend (bcrypt)
- Token expiry prevents long-term abuse
- Role checks on both frontend and backend
- CSRF not needed (JWT in header, not cookie)

### Checklist
- [x] Login page with form validation
- [x] Register page with role selection
- [x] Auth context with token management
- [x] Protected routes component
- [x] Role-based access component
- [x] Forgot password flow
- [x] Reset password flow
- [x] Email verification page
- [x] Email verification banner
- [x] Resend verification email
- [x] Profile view page
- [x] Profile edit page
- [x] Token refresh logic
- [x] Auto-logout on expiry

---

## 11. Database Access & Seeding

> **Status:** ✅ Learned
> **When:** After setting up Docker containers

### What We Learned
How to access PostgreSQL data running in Docker and seed the database with initial data.

### Access Methods

**1. Docker exec (command line):**
```bash
# List all tables
docker exec beleqet-postgres psql -U beleqet_user -d beleqet_db -c "\dt"

# View all data in a table
docker exec beleqet-postgres psql -U beleqet_user -d beleqet_db -c "SELECT * FROM users;"

# Run custom SQL
docker exec beleqet-postgres psql -U beleqet_user -d beleqet_db -c "SELECT COUNT(*) FROM jobs;"
```

**2. Prisma Studio (visual):**
```bash
# From backend directory
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

**3. GUI Tools (DBeaver, pgAdmin, TablePlus):**
| Field | Value |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `beleqet_db` |
| User | `beleqet_user` |
| Password | `your_password` |

### Database Credentials
From `backend/docker-compose.yml`:
```yaml
POSTGRES_USER: beleqet_user
POSTGRES_PASSWORD: your_password
POSTGRES_DB: beleqet_db
```

### Seeding the Database

**Method 1: Via Docker exec (recommended):**
```bash
docker exec beleqet-backend npx tsx prisma/seed.ts
```

**Method 2: Via package.json script:**
```bash
docker exec beleqet-backend npm run prisma:seed
```

### Seed Script Location
`backend/prisma/seed.ts` — creates:
- 54 job categories
- 5 freelance categories

### Key Tables
| Table | Purpose |
|-------|---------|
| users | All users (job seekers, employers, freelancers, admins) |
| jobs | Job listings |
| job_categories | 54 job categories |
| applications | Job applications |
| freelance_jobs | Freelance gigs |
| freelance_categories | 5 freelance categories |
| bids | Freelance bids/proposals |
| contracts | Freelance contracts |
| escrow_transactions | BeleqetSafe payments |
| freelancer_wallets | Freelancer balances |
| notifications | User notifications |

### Common SQL Commands
```sql
-- Count users
SELECT COUNT(*) FROM users;

-- List all job seekers
SELECT * FROM users WHERE role = 'JOB_SEEKER';

-- List all jobs with company
SELECT j.title, j.location, c.name as company 
FROM jobs j 
LEFT JOIN companies c ON j."companyId" = c.id;

-- Check categories
SELECT * FROM job_categories ORDER BY label;
```

### Checklist
- [x] Access database via Docker exec
- [x] Access database via Prisma Studio
- [x] Access database via GUI tools
- [x] Seed database with categories
- [x] Understand table structure

---

## Notes

Add your own learning notes below as you go:

---
