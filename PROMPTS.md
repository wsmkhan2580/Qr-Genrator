# How I built this with AI (prompt log)

I built this project together with Claude. This file is an honest record of how I worked
with it: what I asked, what I got back, and what I changed in how I asked as the project
went on. The early build prompts are summarised (the app was generated from one long
specification); everything from Phase 2 onwards is quoted as I actually typed it,
typos and Hinglish included.

**Live app:** https://qr-genrator-tau.vercel.app
**Repo:** https://github.com/wsmkhan2580/Qr-Genrator

---

## Phase 1 — One big specification (the first build)

I started with a single, detailed spec instead of many small asks: React/Vite frontend,
Node/Express/PostgreSQL backend, three roles (Worker / Manager / Admin), signed QR codes,
atomic ticket validation, dashboard, CSV export, accessibility, tests, CI and docs, with a
layered backend (routes → controllers → services → repositories → db).

**What worked:** naming the architecture and the hard requirement up front ("two workers
scanning the same ticket at the same instant must not both succeed") produced the
conditional `UPDATE ... WHERE status = 'ACTIVE'` design and a concurrency test.

**What I'd do differently:** the spec said nothing about *how users get accounts* or
*where the app would be hosted*. Both turned into problems later (Phases 3 and 4).

## Phase 2 — Deployment, one question at a time

> "i want to deploy that code on github and vercel where i got that env files"

I pasted my `.env` and asked where the values come from. The answer changed my plan: never
commit `.env`, keep an `.env.example`, put real values in the hosting dashboards, and the
Express API can't run as-is on Vercel, so the API went to Render and the frontend to Vercel.

> "im first time on postgres db im using mongodb for long time so give me steps to get
> database url"

Telling the model my background (MongoDB → Postgres) got me an answer framed around what I
already knew: hosted database, connection string, and the big difference that tables must
be created before use. I used Neon.

> "baki env kha se"  *(where do the rest of the env values come from?)*

Learned which values I generate myself (two separate random secrets), which stay as they
are, and which only exist after deploying (`CLIENT_URL`).

## Phase 3 — Asking for an audit *and* a deliverable

> "itne tu ise anylyze kr test kr or loophole bta iske or mujhe github pr push krna hai
> phle then vercel and render wo steps bhi btana"

My first upload arrived empty (0 bytes) and Claude said so instead of guessing, so I
re-uploaded a zip. Then I gave a clearer instruction:

> "ek kaam kr ab tu khus anylyze kr or jjo bhi changes ho krke updated zip de"
> *(analyse it yourself and give me the updated zip with whatever changes are needed)*

That prompt had a clear task (analyse), an action (fix it) and an output format (zip).
Results I verified in the code, not just in the chat:

- Workers could read the audit log through `/api/analytics/activity` (it was hidden only in
  the UI). Now manager/admin only on the server.
- A manager could promote themselves to admin. Account changes are now admin-only.
- Login timing leaked which emails exist; cancel could race with validate; production
  secrets weren't validated; the demo seed password was public.
- `npm test` didn't run, and the integration tests passed even with no database. They now
  fail loudly in CI.

Backend: 45 tests passing, lint clean. Honest limits: Postgres wasn't available in that
environment so DB integration tests ran in CI mode only, and the frontend tests/build
couldn't run there (my `node_modules` was installed on Windows), so I ran those locally.

## Phase 4 — Debugging with real logs

When Vite crashed I pasted the whole terminal output instead of describing it:

> "Cannot find module './builders/react/buildChildren.js' ... same eror h"

The stack trace showed the broken package was in the **root** `node_modules`, not
`frontend/`. This project uses npm workspaces, so I'd been reinstalling in the wrong place.
Later errors had the same pattern:

> "No workspaces found: --workspace=frontend"  → I was running it from inside `frontend/`.
> "fatal: adding files failed" → I'd run `git init` inside `frontend/` by mistake.

**Lesson:** pasting the exact error plus which folder I was in got a fix in one round.

## Phase 5 — Controlling the answer format

My shell was PowerShell, not cmd, and long answers with many commands confused me. I
started constraining the output:

> "single single comaand de n"
> "give me only command"
> "alg alg install n krne npm" *(don't install separately — one install only)*

Short, explicit constraints worked better than polite requests. It also corrected an
earlier cmd-style answer once I showed the PowerShell error.

## Phase 6 — Product-thinking questions, not just "fix it"

> "brother login page khula hai but create account to hai hi n to me kaise login kru"
> "isme bss admin hi create kr skta hai kya ye best practice ya nahi"

The first was a blocker (no way to create the first user); the second asked for a design
judgement. The answer: closed registration is the right model for an internal staff tool,
the first admin should come from a CLI script (`npm run create-admin`), and the demo seed
must never run against a real database.

## Phase 7 — Testing what I built

> "qr code genrate kaise hoga isme"
> "ab me ise kaise check kru"
> "csv export n hori"

I asked how the QR is generated, how to test it by hand (manual code → duplicate scan →
tampered payload), and reported the CSV bug in four words. Claude read the code and found
the Export button was a plain link that navigated the browser to the API, which fails
quietly when the cookie isn't sent. It now downloads through the same API client as every
other call and shows an error message if it fails.

## Phase 8 — Documentation for reviewers

> "update that readme and give me back and both link in top of readme"

README rewritten with the live and GitHub links at the top, roles table, deploy steps and a
troubleshooting table made of the errors I actually hit.

---

## What I learned about prompting

1. **Give context about yourself.** Saying "I only know MongoDB" changed the whole answer.
2. **Paste real errors and say where you ran the command.** "Not working" costs three
   rounds; the full log costs one.
3. **State the task, the action and the output together.** "Analyse it, fix it, give me a
   zip" beats "check my code".
4. **Constrain the format** when the answer is for a terminal: "only commands, one at a
   time".
5. **Ask "is this best practice?"** after something works. It surfaced design decisions
   (closed registration, secret handling) that a "make it work" prompt never would.
6. **Don't trust "done".** I checked fixes by reading the diff, running the tests, and
   trying the app in the browser. The AI's audit found real bugs, but it also couldn't run
   everything in its sandbox, and it said so.
7. **Missing requirements show up late.** Account creation and hosting weren't in my first
   spec and cost me the most time. Next time they go in the spec.

## Honesty note

Claude wrote most of the code and I directed, tested, deployed and debugged it. The
Phase 1 prompts above are a summary of the specification, not word-for-word. Phases 2–8
are quoted from my real messages.
