# AI Development Prompt Log

This file documents the actual sequence of AI-assisted development steps used to build
this project in a single Claude session, working from one comprehensive specification
covering architecture, security, accessibility, testing, and documentation requirements.
Each entry below reflects a real phase of that session's work, not a hypothetical log.

## Prompt 01 - Architecture
**Purpose:** Establish the overall system shape before writing code.
**Prompt:** "Build a production-ready Ticket QR Code Generator Worker web app: React/Vite
frontend, Node/Express/PostgreSQL backend, RBAC (Worker/Manager/Admin), secure QR-based
ticket validation, dashboard, CSV export, accessibility, tests, CI, and full docs — with
a layered architecture (routes → controllers → services → repositories → db) on the
backend and a component/page/service structure on the frontend."
**Result:** Directory skeleton created (`backend/src/{controllers,routes,middleware,
services,validators,utils,config,db,modules}`, `frontend/src/{components,pages,layouts,
hooks,services,utils,validation,context,routes,styles,tests}`, `database/migrations`,
`.github/workflows`), plus root `package.json`/`.gitignore` wiring both apps together.

## Prompt 02 - Database
**Purpose:** Design a normalized, indexed, constraint-enforcing schema.
**Prompt:** "Design the PostgreSQL schema for users, tickets, and an audit log, matching
the given field lists, with UUIDs, enums for role/status, unique ticket codes, foreign
keys, indexes on the lookup columns (ticket_code, customer_phone, customer_email, status,
created_by, created_at), and `updated_at` triggers."
**Result:** `database/migrations/001_init.sql` and `backend/src/db/{pool.js,migrate.js}`,
using raw parameterized SQL (chosen over an ORM codegen step to keep the query layer
transparent and dependency-light) plus a transaction helper for atomic operations.

## Prompt 03 - Authentication
**Purpose:** Implement secure, cookie-based auth with RBAC enforced server-side.
**Prompt:** "Implement login/logout with bcrypt-hashed passwords, a JWT stored in an
HTTP-only cookie, and middleware that re-reads the user's current role/active status from
the database on every request rather than trusting a cached claim. Add a role-gate
middleware factory and auth-specific rate limiting."
**Result:** `backend/src/middleware/auth.js`, `rateLimit.js`, `controllers/authController.js`,
`routes/auth.routes.js`, `modules/users/{user.repository,user.service}.js`.

## Prompt 04 - Ticket Generation
**Purpose:** Generate unique, human-readable ticket codes and secure QR payloads.
**Prompt:** "Generate a short human-readable ticket code and a separate, HMAC-signed,
opaque QR payload that encodes no customer PII. Create the ticket and its QR payload
atomically in one transaction, retrying on the rare ticket-code collision."
**Result:** `backend/src/utils/ticketToken.js`, `utils/qr.js`,
`modules/tickets/{ticket.repository,ticket.service}.js` (`createTicket`).

## Prompt 05 - QR Validation
**Purpose:** Validate tickets safely under concurrent access, never trusting client input.
**Prompt:** "Implement ticket validation that accepts either a manually entered code or a
scanned QR payload, re-verifies the payload's signature server-side, and transitions
ACTIVE → USED using a conditional `UPDATE ... WHERE status = 'ACTIVE'` so two concurrent
validation attempts on the same ticket can't both succeed. Log every attempt, success or
failure, to the audit table in the same transaction."
**Result:** `validateTicket()` in `ticket.service.js`, `markTicketUsedAtomic()` in
`ticket.repository.js`, `modules/audit/audit.service.js`, plus a concurrent-request
integration test asserting exactly one of two simultaneous validations succeeds.

## Prompt 06 - Security
**Purpose:** Apply defense-in-depth across the API surface.
**Prompt:** "Add Helmet, a CORS allow-list, request body size limits, general + auth rate
limiting, centralized error handling that never leaks stack traces or raw DB errors,
Zod validation on every mutating endpoint, and CSV export that escapes cells and
neutralizes formula-injection prefixes."
**Result:** `middleware/{errorHandler,validate,rateLimit}.js`, `utils/{errors,csv}.js`,
`app.js` middleware pipeline, `controllers/exportController.js`.

## Prompt 07 - Accessibility
**Purpose:** Build WCAG 2.2 AA-oriented UI primitives from the start, not retrofitted.
**Prompt:** "Build accessible form primitives (labeled inputs, `aria-describedby` errors
announced via `role=alert`), a focus-trapping modal, a skip link, a status badge that
pairs color with text/symbol rather than color alone, and a responsive ticket table that
becomes a card list on narrow screens."
**Result:** `frontend/src/components/{TextField,SelectField,Modal,SkipLink,StatusBadge,
TicketTable,EmptyState,LoadingSpinner,Pagination,OfflineBanner}.jsx`,
`layouts/DashboardLayout.jsx`.

## Prompt 08 - Testing
**Purpose:** Cover both happy and unhappy paths, including the race condition.
**Prompt:** "Write backend unit tests for the CSV escaping and QR token signing/tamper
rejection, and integration tests for login (valid/invalid/malformed), RBAC enforcement,
ticket creation validation, search, and — critically — a test that fires two concurrent
validation requests at the same ticket and asserts exactly one succeeds. Write frontend
tests for login validation errors, server-error rendering, protected-route redirects, and
the empty/loading states."
**Result:** `backend/tests/{unit,integration}/*.test.js`,
`frontend/src/tests/{components,LoginPage,ProtectedRoute}.test.jsx`.

## Prompt 09 - UI Polish
**Purpose:** Assemble the pages into a cohesive, monochrome, corporate dashboard.
**Prompt:** "Build the Dashboard, Tickets list (search/filter/pagination/CSV export),
Create Ticket form, Ticket detail page (printable QR card, download, cancel), Validate
Ticket page (manual entry plus optional camera scanner), and Workers management page,
wired together with React Router and an AuthContext, using a clean black/white/gray
visual system with no decorative gradients or unnecessary animation."
**Result:** `frontend/src/pages/*.jsx`, `App.jsx`, `context/AuthContext.jsx`,
`services/*.js`, `validation/schemas.js`.

## Prompt 10 - Final Audit
**Purpose:** Verify the definition-of-done checklist and document the result honestly.
**Prompt:** "Go through the security, accessibility, UX, and database checklists from the
spec; write the README (setup, architecture, security, deployment, troubleshooting,
known limitations), the API reference, and this prompt log — and be explicit about what
could not be executed in this environment (no network access, so `npm install`, a live
PostgreSQL instance, and the test suites could not actually be run here) rather than
claiming false verification."
**Result:** `README.md`, `API.md`, `PROMPTS.md`, `.github/workflows/ci.yml` (so the
checklist *is* actually run automatically on every push, even though it couldn't be run
locally in this session).

---

**Honesty note:** This session's environment had no network access. All source files
above were written directly and reviewed for correctness, but `npm install`, the actual
PostgreSQL migrations/seed, and the Jest/Vitest suites were not executed in this
environment. The CI workflow (Prompt 10) is configured to run the full install → lint →
migrate → test → build → audit pipeline automatically in GitHub Actions, which does have
network and a real ephemeral Postgres instance available.
