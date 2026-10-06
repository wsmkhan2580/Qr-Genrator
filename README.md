# Ticket QR Code Generator — Worker Web Application

🔗 **Live app:** https://qr-genrator-tau.vercel.app
📦 **GitHub repo:** https://github.com/wsmkhan2580/Qr-Genrator

A production-oriented, full-stack ticketing system that lets authorized workers and
managers/admins create, manage, validate, search, and export QR-coded tickets through a
role-based corporate dashboard.

> Accounts are **invite-only**: there is no public sign-up. The first admin is created
> from the command line (`npm run create-admin`), and admins then create worker accounts
> from the Workers page.

## 1. Project Overview

Workers create tickets for customers; each ticket gets a unique, cryptographically signed
QR code. At the event, workers scan or manually enter a ticket code to validate entry.
Validation is atomic at the database level so two workers scanning the same ticket at the
same instant cannot both succeed. Managers/admins get cross-worker visibility, analytics,
CSV export, and (admins) worker account management.

## 2. Features

- Secure cookie-based authentication (bcrypt-hashed passwords, HTTP-only JWT cookie)
- Role-based access control (WORKER / MANAGER / ADMIN), enforced server-side
- Closed registration: only admins can create or modify accounts; nobody can change their
  own role or active status
- Ticket creation with full client + server validation
- Unique, tamper-proof QR codes (HMAC-signed opaque token; no customer PII embedded)
- Race-condition-safe ticket validation and cancellation (conditional `UPDATE`)
- Manual code entry **and** camera-based QR scanning on supported devices
- Searchable, filterable, paginated ticket table (server-side pagination)
- Dashboard analytics: totals, by-status counts, tickets/day, tickets/worker
- CSV export with formula-injection protection, scoped to the requester's permissions
- Audit log of every sensitive action (login, create, validate, cancel, worker changes),
  visible to managers/admins only
- CSRF protection (Origin check on state-changing requests)
- WCAG 2.2 AA-oriented accessibility (semantic HTML, labels, focus states, skip link)
- Mobile-first responsive layout (320px–1440px+), print-friendly ticket view
- Basic offline awareness (connection banner; never claims success before server confirms)

## 3. Architecture

```
Browser (React SPA on Vercel)
   │  HTTPS, credentialed cookie
   ▼
Express API (Node.js on Render)
   │  parameterized SQL (TLS)
   ▼
PostgreSQL (Neon)
```

- **Frontend**: React + Vite SPA. Talks to the backend only via a service layer
  (`src/services`); no direct fetch calls scattered through components.
- **Backend**: layered as `routes → controllers → services (modules/) → repositories → db`.
  Business logic lives in services; repositories hold every parameterized SQL query.
- **Auth**: JWT stored in an HTTP-only cookie (`Secure`, SameSite configurable). The
  backend re-reads the user's role/active status from the DB on every request rather than
  trusting a cached claim.

## 4. Technology Stack

**Frontend**: React, Vite, React Router, Axios, Tailwind CSS, React Hook Form, Zod,
`html5-qrcode`, Vitest + Testing Library, ESLint.

**Backend**: Node.js, Express, PostgreSQL (`pg`, parameterized queries, no ORM), Zod,
Helmet, CORS, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`, `qrcode`,
Jest + Supertest, ESLint.

## 5. Folder Structure

```
ticket-qr-generator/
├── backend/
│   ├── src/
│   │   ├── controllers/   # HTTP request/response glue
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth, RBAC, CSRF origin guard, validation, rate limiting, errors
│   │   ├── modules/       # users/tickets/audit — service + repository per domain
│   │   ├── validators/    # Zod schemas
│   │   ├── utils/         # QR, CSV, ticket tokens, errors, analytics
│   │   ├── config/        # env loader + production secret checks
│   │   ├── db/            # pool, migration runner
│   │   └── app.js / server.js
│   ├── prisma/            # seed.js (demo data) and create-admin.js (real admin)
│   ├── tests/{unit,integration}/
│   └── .env.example
├── frontend/
│   ├── src/               # components, pages, layouts, context, routes, services, ...
│   ├── vercel.json        # SPA rewrite + security headers
│   └── .env.example
├── database/migrations/   # raw SQL migrations (001_init.sql, ...)
├── .github/workflows/ci.yml
├── README.md, API.md, DEPLOY.md, AUDIT-CHANGES.md, PROMPTS.md
├── .env.example
└── package.json           # npm workspaces root (backend + frontend)
```

## 6. Requirements

- Node.js 20 LTS (18+ works)
- PostgreSQL ≥ 14 (local) or a hosted database such as Neon
- npm ≥ 9

## 7. Installation

This repo uses **npm workspaces**: install **once, from the repo root**. Do not run
`npm install` separately inside `backend/` or `frontend/`.

```bash
git clone https://github.com/wsmkhan2580/Qr-Genrator.git ticket-qr-generator
cd ticket-qr-generator
npm install
```

## 8. PostgreSQL Setup

**Option A – hosted (easiest):** create a free project at neon.tech and copy the
connection string (`postgresql://...?sslmode=require`).

**Option B – local:**

```sql
CREATE ROLE ticket_app WITH LOGIN PASSWORD 'changeme';
CREATE DATABASE ticket_qr_db OWNER ticket_app;
```

## 9. Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # only if the API isn't on localhost:4000
```

Generate each secret separately (they must be different from each other):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Hosted databases need `?sslmode=require` |
| `JWT_SECRET` | ≥ 32 random chars |
| `TICKET_TOKEN_SECRET` | ≥ 32 random chars, different from `JWT_SECRET`. **Changing it invalidates every QR already issued.** |
| `CLIENT_URL` | Frontend origin, no trailing slash. Comma-separate for several origins |
| `COOKIE_SAMESITE` | `strict` / `lax` / `none`. Default `lax` in dev, `none` in production (needed when frontend and API are on different domains) |
| `TRUST_PROXY_HOPS` | Reverse proxies in front of the API (default `1`) |
| `VITE_API_URL` (frontend) | Backend base URL including `/api` |

**Never commit `.env`.** In production the server refuses to start if the secrets are
missing, too short, placeholders, or identical.

## 10. Database Migrations

```bash
npm run migrate
```

Applies every `.sql` file in `database/migrations/` in order, tracked in a
`schema_migrations` table so re-running is safe.

## 11. Creating Users

### Real admin (use this for any real database)

```bash
npm run create-admin
```

Prompts for name, email, and password (min. 8 characters with upper-case, lower-case, and a
number). Or non-interactively with `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
Further accounts are created by the admin from the **Workers** page.

### Demo data (local development only)

```bash
npm run seed
```

Creates 1 admin, 1 manager, 2 workers, and sample tickets. The demo password is public,
so **never seed a database that is reachable from the internet** — the seed script
refuses to run when `NODE_ENV=production`.

| Role    | Email                 | Password       |
|---------|------------------------|----------------|
| Admin   | admin@demo.local       | `DemoPass123!` |
| Manager | manager@demo.local     | `DemoPass123!` |
| Worker  | worker1@demo.local     | `DemoPass123!` |
| Worker  | worker2@demo.local     | `DemoPass123!` |

### Roles

| Capability | WORKER | MANAGER | ADMIN |
|---|:-:|:-:|:-:|
| Create / view own tickets, validate tickets | ✅ | ✅ | ✅ |
| View all tickets, analytics, audit feed, CSV export (all) | – | ✅ | ✅ |
| List accounts | – | ✅ | ✅ |
| Create / change accounts | – | – | ✅ |

## 12. Running the Backend

```bash
npm run dev:backend      # http://localhost:4000
```

## 13. Running the Frontend

```bash
npm run dev:frontend     # http://localhost:5173
```

Run both in separate terminals, then open http://localhost:5173.

## 14. Running Tests

```bash
npm run test:backend     # needs DATABASE_URL pointing at a disposable, migrated test DB
npm run test:frontend
npm test                 # both
```

Backend unit tests (tokens, CSV, validators, CSRF guard, account rules, secrets) run
without a database. Integration tests need Postgres: locally they skip if it is
unreachable, but when `CI` or `REQUIRE_DB` is set they **fail** instead of silently
passing.

## 15. Linting

```bash
npm run lint
```

## 16. Production Build

```bash
npm run build:frontend        # outputs frontend/dist (static assets)
npm run start --workspace backend
```

## 17. API Documentation

See [`API.md`](./API.md).

## 18. Security Considerations

- Passwords hashed with bcrypt (cost 12); never returned in any API response. Login
  compares against a real dummy hash so response time doesn't reveal which emails exist.
- All SQL is parameterized; `LIKE` search input is escaped.
- RBAC enforced in middleware on every protected route, not just hidden in the UI.
- Account management is admin-only; self role/active changes are blocked.
- QR payloads are HMAC-signed opaque tokens; the server re-verifies the signature and
  ticket state on every validation attempt.
- Validation and cancellation are atomic conditional updates (no double-use, no
  cancel-after-use race).
- CSRF: state-changing requests must come from the configured frontend `Origin`.
- Helmet, CORS allow-list, body size limits, and auth + general rate limiting enabled.
- Production secrets are validated at boot; DB connections verify the TLS certificate.
- CSV export escapes all cells and neutralizes formula-injection prefixes.
- Error responses never leak stack traces or raw database errors.
- Run `npm audit` (wired into CI) regularly and address high/critical findings.

## 19. Accessibility Verification

- Every form field has an associated `<label>`; errors use `role="alert"` and
  `aria-describedby`.
- Modals trap focus, close on `Escape`, and restore focus to the trigger on close.
- Status is never conveyed by color alone (`StatusBadge` pairs color with a symbol + text).
- A skip-navigation link is present on every authenticated page.
- `prefers-reduced-motion` disables non-essential animation.
- Recommended manual check before release: Lighthouse and/or `axe-core` on the Dashboard,
  Tickets list, Create Ticket, and Validate Ticket screens.

## 20. Deployment

Stack: **GitHub → Neon (database) → Render (API) → Vercel (frontend)**.
Full step-by-step guide: [DEPLOY.md](DEPLOY.md). Summary:

1. **Neon:** create a project, copy the pooled connection string. Locally run
   `npm run migrate` and `npm run create-admin` against it.
2. **Render (Web Service):** leave *Root Directory* empty (monorepo).
   Build: `npm ci && npm run migrate --workspace backend` ·
   Start: `npm run start --workspace backend` · Health check: `/api/health`.
   Env: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `TICKET_TOKEN_SECRET`,
   `COOKIE_SAMESITE=none`, `CLIENT_URL=https://qr-genrator-tau.vercel.app`.
3. **Vercel:** *Root Directory* `frontend`, Vite preset, env
   `VITE_API_URL=https://<your-render-service>.onrender.com/api`.
4. After the first deploy, make sure Render's `CLIENT_URL` exactly matches the Vercel URL
   (no trailing slash) and redeploy the API.

> **Safari / iPhone:** `vercel.app` and `onrender.com` are different sites, so the login
> cookie is third-party and Safari blocks it by default. For real use, host both under one
> domain (e.g. `app.example.com` + `api.example.com`) and set `COOKIE_SAMESITE=lax`.

## 21. CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`: installs from the root
lockfile (`npm ci`), lints, applies migrations to an ephemeral Postgres service
container, runs backend tests (failing if the DB is unreachable), runs frontend tests,
builds the frontend, and runs a non-blocking dependency audit.

## 22. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Missing required environment variable: DATABASE_URL` | `backend/.env` not created from `.env.example` |
| Server exits at start: `JWT_SECRET ... placeholder` / `must be different` | Production secrets are missing, short, placeholders, or identical — generate two new random values |
| Login works, then immediately "not authenticated" | Cookie blocked: check `CLIENT_URL` matches the frontend origin exactly, `COOKIE_SAMESITE=none` in production, and try Chrome (Safari blocks third-party cookies) |
| CORS error / 403 "Request origin is not allowed" | `CLIENT_URL` doesn't match the frontend origin (no trailing slash, same `https`) |
| Page refresh gives 404 on Vercel | `frontend/vercel.json` missing from the deployed repo |
| Frontend calls `localhost:4000` in production | `VITE_API_URL` not set on Vercel; set it and **redeploy** (Vite bakes it in at build time) |
| `Cannot find module './builders/react/buildChildren.js'` (Windows) | Corrupted install. Delete `node_modules` and `package-lock.json`, then run `npm install` once from the repo root |
| `No workspaces found: --workspace=frontend` | Run workspace commands from the repo root, not from inside `frontend/` |
| `Port 5173 is in use` | An old Vite process is still running; close it (the API's `CLIENT_URL` expects 5173) |
| Migrations fail with `permission denied` | The DB role in `DATABASE_URL` doesn't own the target database |
| Camera scanner won't start | Browsers require HTTPS (or `localhost`) for camera access; manual code entry always works |
| QR scans stopped working | `TICKET_TOKEN_SECRET` was changed; re-create the tickets |
| Render API slow on first request | Free plan sleeps when idle; the first request can take up to a minute |

## 23. Demo Credentials

See section 11. Development-only; never use them on a real deployment.

## 24. Known Limitations

- No self-service sign-up or "forgot password": admins create accounts and reset access.
- No email delivery (ticket confirmations are not emailed to customers).
- Tickets never auto-expire and validation does not check `event_date`; a ticket for a
  past event can still be validated.
- A ticket with `quantity > 1` admits the whole group on a single scan.
- JWTs are stateless: logout clears the cookie, but a stolen token stays valid until it
  expires (deactivating the account blocks it immediately).
- Rate limiting is in-memory, so it is only accurate with a single API instance.
- Offline support is limited to a connection-status indicator; writes are not queued.
- CSV export builds the whole file in one response; very large volumes should move to a
  background/streamed export.
- The camera scanner depends on `getUserMedia` support; otherwise use manual entry.
