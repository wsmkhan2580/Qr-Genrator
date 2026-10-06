# Deploying: GitHub → Neon (DB) → Render (API) → Vercel (frontend)

## 0. Never commit secrets
`.env` files are git-ignored. Only `.env.example` files are committed.
Generate each secret separately:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 1. Database (Neon)
Create a project at neon.tech and copy the connection string
(`postgresql://...?sslmode=require`). Use the **pooled** string for the API.

Create the tables, then a real admin (do **not** run `npm run seed` against a
real database: its demo password is public):
```
npm install
npm run migrate --workspace backend
npm run create-admin --workspace backend
```
(Run these locally with `backend/.env` pointing at the Neon URL.)

## 2. API on Render (Web Service)
| Setting | Value |
|---|---|
| Root Directory | *(leave empty — repo root)* |
| Build Command | `npm ci && npm run migrate --workspace backend` |
| Start Command | `npm run start --workspace backend` |
| Health Check Path | `/api/health` |

Environment variables:
```
NODE_ENV=production
DATABASE_URL=<neon pooled url>
JWT_SECRET=<random 96 hex chars>
TICKET_TOKEN_SECRET=<a different random value>
CLIENT_URL=https://<your-app>.vercel.app      # no trailing slash
COOKIE_SAMESITE=none                           # frontend + API on different domains
```
In production the server refuses to start if the two secrets are missing,
short, placeholders, or identical.

## 3. Frontend on Vercel
| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite (auto) |
| Env var | `VITE_API_URL=https://<your-api>.onrender.com/api` |

After the first deploy, put the Vercel URL into Render's `CLIENT_URL` and redeploy the API.

## 4. Known limitation: iPhone/Safari
`vercel.app` and `onrender.com` are different sites, so the login cookie is a
third-party cookie, and Safari blocks those by default. For real use (workers
scanning on iPhones) put both under one domain, e.g. `app.example.com` and
`api.example.com`, then set `COOKIE_SAMESITE=lax` and `CLIENT_URL=https://app.example.com`.

## 5. Smoke test
1. `https://<api>/api/health` → `{"status":"ok","database":"connected"}`
2. Log in with the admin you created.
3. Create a ticket, validate it once (OK), validate again (must say already used).
