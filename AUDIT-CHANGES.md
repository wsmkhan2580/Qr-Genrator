# Audit changes

## Security fixes
1. `GET /api/analytics/activity` was open to any logged-in user (workers could read the audit feed: names, emails, ticket codes). Now MANAGER/ADMIN only.
2. A MANAGER could create ADMIN accounts and promote themselves. User create/update is now ADMIN-only, and nobody can change their own role/active flag.
3. Login timing leaked which emails exist (malformed dummy bcrypt hash returned instantly). Now compares against a real hash.
4. Added CSRF protection (Origin check on POST/PATCH/DELETE) because production cookies must be SameSite=None. Removed the unused urlencoded body parser.
5. Cancel could overwrite a just-validated ticket back to CANCELLED (race). Now a single conditional UPDATE inside a transaction with its audit entry.
6. Production boot now rejects missing/short/placeholder/identical `JWT_SECRET` and `TICKET_TOKEN_SECRET` (the ticket secret used to silently fall back to the JWT secret).
7. Seed script refuses to run with `NODE_ENV=production` (public demo password). New `npm run create-admin`.
8. DB TLS: certificate verification enabled for hosted databases (was `rejectUnauthorized: false`).

## Bugs fixed
- Production cookie was `SameSite=Strict`, which breaks login when frontend and API are on different domains. Now configurable (`COOKIE_SAMESITE`, default `none` in production).
- Non-UUID ids, bad dates and `from`/`to` filters caused 500s; now 422.
- Search treated `%` and `_` as wildcards.
- Camera scanner re-validated the same QR ~10×/second and replaced the success message with "already used".
- Workers page: unhandled errors on deactivate; no self-deactivate button.
- `npm test` failed on ESM without `--experimental-vm-modules`; integration tests passed vacuously when no DB was reachable (now fail when `CI`/`REQUIRE_DB` is set).
- CI pointed at lockfiles that don't exist (workspaces use the root one); frontend had 4 lint errors that failed CI.
- Added `frontend/vercel.json` (SPA rewrite so refresh doesn't 404, security headers, camera allowed).

## Not changed (your call)
- Tickets never auto-expire and validation ignores `event_date`, so a ticket for a past event still validates.
- `quantity > 1` admits the whole group on one scan.
- JWTs are stateless: logout clears the cookie but a stolen token works until it expires (account deactivation is checked on every request).
- Rate limiting is in-memory (fine for one Render instance only).
