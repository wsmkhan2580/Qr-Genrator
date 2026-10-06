# Ticket QR Code Generator — Worker Web Application

A production-oriented, full-stack ticketing system that lets authorized workers and
managers/admins create, manage, validate, search, and export QR-coded tickets through a
role-based corporate dashboard.

## 1. Project Overview

Workers create tickets for customers; each ticket gets a unique, cryptographically signed
QR code. At the event, workers scan or manually enter a ticket code to validate entry.
Validation is atomic at the database level so two workers scanning the same ticket at the
same instant cannot both succeed. Managers/admins get cross-worker visibility, analytics,
CSV export, and worker account management.

## 2. Features

- Secure cookie-based authentication (bcrypt-hashed passwords, HTTP-only JWT cookie)
- Role-based access control (WORKER / MANAGER / ADMIN), enforced server-side
- Ticket creation with full client + server validation
- Unique, tamper-proof QR codes (HMAC-signed opaque token; no customer PII embedded)
- Race-condition-safe ticket validation (`UPDATE ... WHERE status = 'ACTIVE'`)
- Manual code entry **and** camera-based QR scanning on supported devices
- Searchable, filterable, paginated ticket table (server-side pagination)
- Dashboard analytics: totals, by-status counts, tickets/day, tickets/worker
- CSV export with formula-injection protection, scoped to the requester's permissions
- Audit log of every sensitive action (login, create, validate, cancel, worker changes)
- WCAG 2.2 AA-oriented accessibility (semantic HTML, labels, focus states, skip link)
- Mobile-first responsive layout (320px–1440px+), print-friendly ticket view
- Basic offline awareness (connection banner; never claims success before server confirms)

## 3. Architecture

```
Browser (React SPA)
   │  HTTPS, credentialed cookie
   ▼
Express API (Node.js)
   │  parameterized SQL
   ▼
PostgreSQL
```

- **Frontend**: React + Vite SPA. Talks to the backend only via a typed service layer
  (`src/services`); no direct fetch calls scattered through components.
- **Backend**: layered as `routes → controllers → services (modules/) → repositories → db`.
  Business logic lives in services; repositories hold every parameterized SQL query.
- **Auth**: JWT stored in an HTTP-only, SameSite cookie. The backend re-reads the user's
  role/active status from the DB on every request rather than trusting a cached claim.

## 4. Technology Stack

**Frontend**: React, Vite, React Router, Axios, Tailwind CSS, React Hook Form, Zod,
`qrcode`/`html5-qrcode`, Vitest + Testing Library, ESLint.

**Backend**: Node.js, Express, PostgreSQL (`pg`, parameterized queries — no ORM
code-generation step required), Zod, Helmet, CORS, `express-rate-limit`, `bcryptjs`,
`jsonwebtoken`, Jest + Supertest, ESLint.

## 5. Folder Structure

```
ticket-qr-generator/
├── backend/
│   ├── src/
│   │   ├── controllers/   # HTTP request/response glue
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth, RBAC, validation, rate limiting, error handling
│   │   ├── modules/       # users/tickets/audit — service + repository per domain
│   │   ├── validators/    # Zod schemas
│   │   ├── utils/         # QR, CSV, ticket tokens, errors, analytics
│   │   ├── config/        # env loader
│   │   ├── db/            # pool, migration runner
│   │   └── app.js / server.js
│   ├── prisma/seed.js     # demo data seed (name kept for familiarity; no Prisma runtime used)
│   ├── tests/{unit,integration}/
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # reusable, accessible UI primitives
│   │   ├── pages/         # route-level screens
│   │   ├── layouts/       # DashboardLayout (nav, skip link, offline banner)
│   │   ├── context/       # AuthContext
│   │   ├── routes/        # ProtectedRoute guard
│   │   ├── services/      # API client + per-resource service functions
│   │   ├── validation/    # Zod schemas mirroring backend rules
│   │   ├── hooks/, utils/, styles/, tests/
│   └── .env.example
├── database/migrations/   # raw SQL migrations (001_init.sql, ...)
├── .github/workflows/ci.yml
├── README.md, API.md, PROMPTS.md
├── .env.example
└── package.json           # thin workspace wrapper for both apps
```

> Deploying? See [DEPLOY.md](DEPLOY.md) for GitHub, Neon, Render and Vercel steps.

## 6. Requirements

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

## 7. Installation

```bash
git clone <this-repo> ticket-qr-generator
cd ticket-qr-generator
npm run install:all
```

## 8. PostgreSQL Setup

Create a database and a dedicated app role (adjust names/password):

```sql
CREATE ROLE ticket_app WITH LOGIN PASSWORD 'changeme';
CREATE DATABASE ticket_qr_db OWNER ticket_app;
```

## 9. Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # optional, only if API isn't on localhost:4000
```

Edit `backend/.env` and set at minimum `DATABASE_URL`, `JWT_SECRET`, and
`TICKET_TOKEN_SECRET` to strong, unique values. **Never commit `.env`.**

## 10. Database Migrations

```bash
npm run migrate
```

This applies every `.sql` file in `database/migrations/` in order, tracked in a
`schema_migrations` table so re-running is safe.

## 11. Seed Instructions

```bash
npm run seed
```

Creates 1 admin, 1 manager, 2 workers, and sample tickets in different statuses.
**Demo credentials (development only — do not use in production):**

| Role    | Email                 | Password       |
|---------|------------------------|----------------|
| Admin   | admin@demo.local       | `DemoPass123!` |
| Manager | manager@demo.local     | `DemoPass123!` |
| Worker  | worker1@demo.local     | `DemoPass123!` |
| Worker  | worker2@demo.local     | `DemoPass123!` |

## 12. Running the Backend

```bash
npm run dev:backend      # http://localhost:4000
```

## 13. Running the Frontend

```bash
npm run dev:frontend     # http://localhost:5173
```

## 14. Running Tests

```bash
npm run test:backend     # requires DATABASE_URL pointed at a disposable test DB, migrated
npm run test:frontend
npm test                 # both
```

Backend integration tests skip gracefully (rather than failing) if no test database is
reachable, so `npm test` doesn't hard-fail in environments without Postgres running yet.

## 15. Linting

```bash
npm run lint
```

## 16. Production Build

```bash
npm run build:frontend        # outputs frontend/dist (static assets)
NODE_ENV=production npm run dev:backend   # or: node backend/src/server.js
```

Serve `frontend/dist` from your static host/CDN of choice and point `VITE_API_URL` at
your deployed backend origin.

## 17. API Documentation

See [`API.md`](./API.md).

## 18. Security Considerations

- Passwords hashed with bcrypt (cost factor 12); never returned in any API response.
- All SQL is parameterized — no string-concatenated queries.
- RBAC enforced in middleware on every protected route, not just hidden in the UI.
- QR payloads are HMAC-signed opaque tokens; the server re-verifies signature and ticket
  state on every validation attempt rather than trusting client-supplied data.
- Ticket validation is atomic (conditional `UPDATE`) to prevent double-validation races.
- Helmet, CORS allow-list, request body size limits, and both auth-specific and general
  rate limiting are enabled.
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
- Recommended manual check before release: run Lighthouse and/or `axe-core` against the
  Dashboard, Tickets list, Create Ticket, and Validate Ticket screens.

## 20. Deployment Instructions

1. Provision a managed PostgreSQL instance; set `DATABASE_URL` accordingly.
2. Set `NODE_ENV=production` and strong, unique `JWT_SECRET` / `TICKET_TOKEN_SECRET`
   values via your platform's secret manager — never in source control.
3. Run `npm run migrate` (and `npm run seed` only for a first-time demo/staging setup —
   skip seeding in real production).
4. Deploy the backend as a long-running Node process (e.g. behind a process manager or
   container orchestrator) with `trust proxy` already enabled for correct client IPs
   behind a load balancer.
5. Build the frontend (`npm run build:frontend`) and deploy `frontend/dist` to a static
   host/CDN; set `VITE_API_URL` at build time to the backend's public URL.
6. Ensure the backend's `CLIENT_URL` matches the deployed frontend origin exactly (CORS).
7. Terminate TLS in front of both services; cookies are marked `Secure` automatically
   when `NODE_ENV=production`.

## 21. CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`: installs dependencies, lints,
runs backend integration tests against an ephemeral Postgres service container, runs
frontend unit tests, builds the frontend, and runs a non-blocking dependency audit for
both apps.

## 22. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Missing required environment variable: DATABASE_URL` | `backend/.env` not created from `.env.example` |
| 401 on every request after login | Cookie blocked — check `CLIENT_URL` matches the frontend origin exactly, and that you're not mixing `http`/`https` |
| CORS error in browser console | `CLIENT_URL` in backend `.env` doesn't match the frontend's actual origin |
| Migrations fail with `permission denied` | The DB role in `DATABASE_URL` doesn't own the target database |
| Camera scanner won't start | Browser requires HTTPS (or `localhost`) for camera access; manual code entry always works as a fallback |

## 23. Demo Credentials

See section 11 above. These are development-only and must never be used in a real
deployment.

## 24. Known Limitations

- No email delivery (ticket confirmations are not emailed to customers).
- Offline support is limited to a connection-status indicator and avoiding false
  "success" states — it does not queue and replay writes once back online.
- CSV export streams the full result set in one response; for very large ticket volumes
  this should move to background/streamed export.
- The camera QR scanner depends on browser support for `getUserMedia`; unsupported
  browsers fall back to manual code entry only.
