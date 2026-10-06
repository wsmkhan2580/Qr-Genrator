# API Reference

Base URL: `http://localhost:4000/api` (or your deployed backend origin)

All requests/responses are JSON unless noted. Authenticated requests rely on an
HTTP-only session cookie set by `POST /auth/login` — send requests with
credentials/cookies enabled (`withCredentials: true` on the frontend's Axios client).

## Response Envelope

Success:
```json
{ "success": true, "data": { } }
```

Error:
```json
{ "success": false, "error": { "code": "TICKET_NOT_FOUND", "message": "Ticket not found.", "details": [] } }
```

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Request body/query failed schema validation; `details` lists per-field messages |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired session |
| `FORBIDDEN` | 403 | Authenticated, but role lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist (or isn't visible to this role) |
| `CONFLICT` | 409 | State conflict — e.g. ticket already used, duplicate email |
| `RATE_LIMITED` | 429 | Too many requests in the current window |
| `INTERNAL_ERROR` | 500 | Unexpected server error (details never leaked) |

---

## Authentication

### `POST /auth/login`
Rate-limited. Body:
```json
{ "email": "worker1@demo.local", "password": "DemoPass123!" }
```
`200` → `{ user: { id, name, email, role, isActive, createdAt, updatedAt } }`, sets session
cookie. `401` on invalid credentials or a deactivated account.

### `POST /auth/logout`
Requires auth. Clears the session cookie. `200` → `{}`

### `GET /auth/me`
Requires auth. `200` → `{ user }`

---

## Tickets

All ticket endpoints require auth. Workers only see/act on tickets they created;
managers/admins see all tickets — enforced server-side.

### `POST /tickets`
Body:
```json
{
  "customerName": "Priya Sharma",
  "customerPhone": "98765 43210",
  "customerEmail": "priya@example.com",
  "eventName": "Autumn Music Festival",
  "eventDate": "2026-11-02",
  "ticketType": "General",
  "quantity": 2
}
```
`201` → `{ ticket, qrImage }` (`qrImage` is a `data:image/png;base64,...` string).
`422` on validation failure.

### `GET /tickets`
Query params: `q`, `status` (`ACTIVE|USED|CANCELLED|EXPIRED`), `from`, `to` (event date
range), `page`, `pageSize`, `sortBy` (`createdAt|eventDate|customerName|status`),
`sortDir` (`asc|desc`).
`200` → `{ tickets: [...], pagination: { page, pageSize, total, totalPages } }`

### `GET /tickets/:id`
`200` → `{ ticket, qrImage }`. `404` if not found or not visible to this role.

### `GET /tickets/:id/qr`
`200` → `{ qrImage, ticketCode }`

### `POST /tickets/verify`
Validates by human-entered code **or** scanned QR payload. Body: `{ "code": "TQG-7F3K9Q" }`
`200` → `{ ticket, message: "Ticket verified successfully." }`
`404` ticket not found · `409` already used/cancelled/expired, or lost a concurrent
validation race.

### `POST /tickets/:id/validate`
Convenience validate-by-id (used from the ticket detail screen). Same responses as
`/tickets/verify`.

### `DELETE /tickets/:id`
Cancels an `ACTIVE` ticket (sets status to `CANCELLED`). `409` if not currently active.

---

## Analytics

### `GET /analytics/overview`
Workers get their own totals; managers/admins additionally get `ticketsByDay` and
`ticketsByWorker`.
`200` → `{ total, ACTIVE, USED, CANCELLED, EXPIRED, todayCount, ticketsByDay?, ticketsByWorker? }`

### `GET /analytics/activity`
Recent audit feed. Requires `MANAGER` or `ADMIN` (`403` for workers). `200` → `{ items: [...] }`

---

## Users (Worker Management)

`GET /users` requires `MANAGER` or `ADMIN`. `POST /users` and `PATCH /users/:id` require `ADMIN`.
An admin cannot change their own `role` or `isActive` (`403`).

### `GET /users`
Query: `page`, `pageSize`. `200` → `{ users, pagination }`

### `POST /users`
Body: `{ name, email, password, role }`. `201` → `{ user }`. `409` if email already exists.

### `PATCH /users/:id`
Body (any subset): `{ name, role, isActive }`. `200` → `{ user }`

---

## Export

### `GET /export/tickets`
Requires auth. Streams `text/csv`. Scoped to the requester's visible tickets. Never
includes password hashes, tokens, or auth secrets. Cell values with a leading
`= + - @` are prefixed with `'` to defuse spreadsheet formula injection.

---

## Health

### `GET /health`
No auth required. `200` → `{ status: "ok", database: "connected" }`, or `503` if the
database is unreachable.
