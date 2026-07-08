# Velvet Hive — Backend API & Security Reference

This documents the current backend: architecture, auth flow, RBAC model, payments, email notifications, and every endpoint with its auth/permission requirements. Pair this with `postman/` (a ready-to-import collection covering every route) for hands-on testing.

## Tech stack

- **Runtime**: Node.js + TypeScript, Express 4
- **Database**: PostgreSQL via Prisma ORM 7 (driver adapter: `@prisma/adapter-pg`)
- **Auth**: JWT access tokens + rotating opaque refresh tokens (custom, not a third-party auth library — see "Why not better-auth" below)
- **Payments**: Paystack (cards) + Safaricom Daraja (M-Pesa STK Push)
- **Email**: Nodemailer over SMTP (point at a local [Mailpit](https://github.com/axllent/mailpit) container in dev, a real provider like Resend in production)
- **Security middleware**: Helmet, express-rate-limit, zod validation on every input boundary

## Folder structure

```
server/
  prisma/
    schema.prisma        # full DB schema (RBAC, catalog, orders, payments, chat)
    seed.ts               # roles/permissions matrix, super admin, 255 seed products
    migrations/
  src/
    app.ts / server.ts    # Express app assembly / HTTP listener
    config/env.ts         # zod-validated environment config (single source of truth)
    lib/                  # prisma client, mailer, email templates, error types, permission cache
    middleware/           # requireAuth, requirePermission, validate, errorHandler, rateLimit
    modules/
      auth/                # register, verify-email, login, refresh, logout, forgot/reset password,
                            # self-service profile/password/avatar, Google OAuth
      users/                # Super Admin user & role management (create/edit/delete)
      products/             # catalog CRUD
      orders/                # checkout / order history / status updates / cancellation
      inventory/             # stock movements (in/out/adjustment)
      security/               # security event feed (logins, logouts, suspicious activity)
      payments/
        paystack/            # card payments
        mpesa/                # Daraja STK Push
```

## Authentication flow

Registration now requires **email verification before first login** — there is no more guest checkout and no more auto-login on register.

```
POST /api/auth/register
  → creates User(emailVerified=false), generates a 6-digit OTP,
    emails it via verificationEmail template
  → response: { message, email }  (no tokens yet)

POST /api/auth/verify-email  { email, code }
  → consumes the OTP, sets emailVerified=true
  → issues access + refresh tokens (auto-login on success)

POST /api/auth/login  { email, password }
  → rejected with 403 EMAIL_NOT_VERIFIED if emailVerified is false
  → on success: updates lastLoginAt/lastLoginIp;
    if the login IP differs from the last known IP, emails a
    "new sign-in to your account" alert (does not block the login)

POST /api/auth/refresh   (reads the httpOnly refreshToken cookie)
  → rotates the refresh token (old one marked revoked + replacedById)
  → if a REVOKED token is replayed, the entire refresh-token family for
    that user is revoked (theft/reuse response) and 401 REFRESH_TOKEN_REUSED
    is returned — this is stronger than typical rotation-only schemes

POST /api/auth/logout   (reads the cookie, revokes it)

POST /api/auth/forgot-password  { email }
POST /api/auth/reset-password   { email, code, newPassword }
  → resetting a password revokes every existing refresh token for that
    user, forcing re-login everywhere (in case the reset was triggered
    by a compromised account)
```

**Token shape**: access tokens are short-lived JWTs (15 min), signed HS256, payload `{ sub, roleId, roleName, email }`, sent as `Authorization: Bearer <token>` — kept in memory client-side, never localStorage. Refresh tokens are opaque random 384-bit values delivered as an `httpOnly`, `SameSite=Lax` cookie scoped to `/api/auth`, stored server-side only as an HMAC-SHA256 hash (never the raw value).

**Staff accounts** (Admin/Accounts/Inventory Clerk/Super Admin) are created directly by a Super Admin via `POST /api/users` and are marked `emailVerified: true` immediately — the OTP loop is specifically for public self-registration (customers), not the trusted staff-creation path.

**Google sign-in** — `GET /api/auth/google` redirects to Google's OAuth consent screen; `GET /api/auth/google/callback` exchanges the authorization code, looks up the user by `googleId` then by `email` (linking the Google identity to an existing password-based account if the email matches), or creates a new `CUSTOMER` account with a random unusable password if neither exists. Sets the refresh cookie and redirects back to `FRONTEND_URL` — the SPA's normal silent-refresh-on-boot flow then picks up the session.

**Self-service account management** (any authenticated user, not just staff): `PATCH /api/auth/profile` (name/phone), `PATCH /api/auth/change-password` (current + new password, revokes every *other* session but keeps the current one — unlike a forgot-password reset, this isn't presumed to be a compromised-account scenario), `POST /api/auth/avatar` (multipart image upload, 2MB limit, JPEG/PNG/WebP, stored on local disk under `uploads/avatars/` — **not yet wired to Cloudinary**, so this won't survive a Render redeploy until that's done).

### Why not `better-auth`

Evaluated the vendored `better-auth` source as a potential replacement. Verdict: keep the custom implementation. `better-auth`'s default session model (DB-checked opaque session token, no rotation/reuse-detection) and its RBAC (`admin` plugin models roles as a single comma-separated string field, not a normalized join table) are both less rigorous than what's already here. Two things *were* borrowed from it: the idea of tight, endpoint-scoped rate limits on credential endpoints specifically (not the whole `/api/auth` mount), and Origin/Referer allowlisting as defense-in-depth alongside `SameSite` cookies (not yet implemented — noted for the production-hardening pass).

## RBAC model

Real DB-backed RBAC — `Role` / `Permission` / `RolePermission` join table, not a hardcoded enum. Each `User` has a single `roleId` FK. Permission keys follow `resource:action`.

| Role | Permissions |
|---|---|
| **SUPER_ADMIN** | Every permission — full system access, including `users:manage` and `roles:manage` |
| **ADMIN** | `products:read/create/update/delete`, `orders:read:all`, `orders:update:status`, `inventory:read`, `reports:stock:read` |
| **ACCOUNTS** | `inventory:read`, `reports:financial:read`, `reports:stock:read`, `orders:read:all` (read-only — no product/order mutation) |
| **INVENTORY_CLERK** | `products:read`, `inventory:read`, `inventory:adjust` |
| **CUSTOMER** | `products:read`, `orders:create`, `orders:read:own`, `chat:use` |

Enforcement is a middleware chain per route: `requireAuth` (verifies JWT, attaches `req.user`) → `requirePermission('products:create')` (checks the role's permission set, loaded into an in-memory cache on boot, not re-queried per request) → `validate(zodSchema)` → controller → centralized `errorHandler`.

## Payments

Both rails converge on one function, `confirmOrderPayment(paymentId)`: it flips `Order.status → PAID`, decrements `Product.stockQuantity`, writes an `InventoryMovement` audit row, and emails an order-confirmation — all inside a single Prisma transaction, and idempotent (safe to call twice for the same payment; a webhook retry or a race with a manual "verify" poll won't double-decrement stock).

**Paystack** — `POST /initialize` creates an `INITIATED` payment row and calls Paystack's Initialize Transaction API, returning a checkout URL. Paystack calls back to `POST /webhook`, which verifies the `x-paystack-signature` header (HMAC-SHA512 over the *raw* request body — captured separately from JSON parsing specifically for this) before trusting the payload. `GET /verify/:reference` is a polling fallback for the frontend if the webhook is slow.

**Daraja (M-Pesa)** — `POST /stk-push` fetches a cached OAuth token, sends an STK Push with an integer KES amount (Daraja's hard requirement — this is why `Product.priceKes` is an `Int`, not a decimal), and stores the returned `CheckoutRequestID` as the payment's `providerRef`. Safaricom calls back to `POST /callback`, which — since Daraja callbacks aren't cryptographically signed — **only ever transitions an existing `PENDING` payment it finds by that `CheckoutRequestID`; it never creates orders or payments from an inbound callback.**

Currently using Safaricom's **sandbox** environment with the publicly-published test Shortcode (174379) and passkey. `DARAJA_CALLBACK_BASE_URL` must be a public HTTPS URL for Safaricom's servers to reach — use an ngrok tunnel for local testing, or the Render URL once deployed.

## Order cancellation

`POST /api/orders/:id/cancel` (`orders:update:status`) requires a `reason` and is only valid from `PENDING_PAYMENT`/`PAID`/`PROCESSING`/`SHIPPED`. If the order had already been paid (stock was decremented), cancelling restores it via a new `InventoryMovement` (`IN`, reason references the order). Always emails the customer with the reason. A background job (`src/lib/scheduler.ts`, checks every 30 minutes) auto-cancels any order still `PENDING_PAYMENT` 48 hours after creation, using this same path.

## Security events

`src/lib/securityEvents.ts` records `LOGIN` / `LOGIN_FAILED` / `LOGOUT` / `SUSPICIOUS_LOGIN` rows (best-effort — a logging failure never breaks the actual auth flow). `GET /api/security/events` (`users:manage`) returns the most recent 200, each with the associated user if one was resolved. The frontend's Security & Logs page merges this with inventory movements and order purchase/cancellation events into one activity feed.

## Email notifications

All sent via `src/lib/mailer.ts` (Nodemailer/SMTP) — delivery failures are logged and swallowed, never crash the request that triggered them.

| Trigger | Template |
|---|---|
| Registration | Email verification OTP (15 min expiry) |
| Forgot password | Password reset OTP (15 min expiry) |
| Login from a new IP | Suspicious sign-in alert (time, IP, device) |
| Payment confirmed | Order confirmation with itemized total |

**To see these locally**: run Mailpit (`docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`) and view sent mail at `http://localhost:8025` — no real email provider needed for development. `.env`'s `SMTP_*` vars already default to Mailpit's port.

## Security measures in place

- Passwords: bcryptjs, cost factor 12
- Refresh tokens: HMAC-SHA256-hashed at rest, rotation-on-use, family-wide revocation on reuse detection
- Rate limiting: general (300 req/15min per IP) + a tight 20 req/10min limit scoped specifically to `/register`, `/login`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`
- Helmet (standard security headers) on every response
- CORS locked to `CORS_ORIGIN` with credentials
- Every request body/query/param validated with zod — no unvalidated input reaches a service function; zod also strips unknown keys, so there's no mass-assignment path
- Prisma parameterized queries everywhere — no raw SQL, no injection surface
- No endpoint response ever includes `passwordHash` (verified in the test suite)
- `forgot-password` and `resend-verification` always return the same generic message whether or not the account exists, to prevent user enumeration
- Order/payment ownership checks: a customer can only read/pay for their own orders unless their role has `orders:read:all`
- Paystack webhook signature verified against the raw request body before any processing
- Daraja callback only transitions pre-existing `PENDING` payments, never creates state from an inbound (unsigned) request
- `app.set('trust proxy', 1)` so rate limiting and `req.ip` work correctly behind Render's reverse proxy

**Known gap, deliberately deferred**: no Origin/Referer allowlist check yet (borrowed idea from `better-auth`, not yet implemented), no CSRF token (currently relying on `SameSite=Lax` + `httpOnly` cookies scoped to `/api/auth`). Flagging both for the production-hardening pass rather than treating them as silently solved.

## Endpoint reference

`🔓` public · `🔑` requires `Authorization: Bearer <accessToken>` · permission column is the `requirePermission(...)` key checked, if any.

### Health
| Method | Path | Auth | Permission |
|---|---|---|---|
| GET | `/api/health` | 🔓 | — |

### Auth (`/api/auth`)
| Method | Path | Auth | Permission | Notes |
|---|---|---|---|---|
| POST | `/register` | 🔓 | — | rate-limited |
| POST | `/verify-email` | 🔓 | — | rate-limited |
| POST | `/resend-verification` | 🔓 | — | rate-limited, generic response |
| POST | `/login` | 🔓 | — | rate-limited |
| POST | `/forgot-password` | 🔓 | — | rate-limited, generic response |
| POST | `/reset-password` | 🔓 | — | rate-limited, revokes all sessions |
| POST | `/refresh` | 🔓 (cookie) | — | |
| POST | `/logout` | 🔓 (cookie) | — | |
| GET | `/me` | 🔑 | — | |
| PATCH | `/profile` | 🔑 | — | update own name/phone |
| PATCH | `/change-password` | 🔑 | — | current + new password |
| POST | `/avatar` | 🔑 | — | multipart, 2MB limit, JPEG/PNG/WebP |
| GET | `/google` | 🔓 | — | redirects to Google's consent screen |
| GET | `/google/callback` | 🔓 | — | Google's redirect target |

### Users (`/api/users`) — everything here requires `users:manage` (Super Admin only)
| Method | Path | Auth | Permission | Notes |
|---|---|---|---|---|
| GET | `/` | 🔑 | `users:manage` | |
| POST | `/` | 🔑 | `users:manage` | |
| PUT | `/:id` | 🔑 | `users:manage` | |
| DELETE | `/:id` | 🔑 | `users:manage` | blocked (409) if the user has order/inventory history — deactivate instead; can't delete yourself |

### Products (`/api/products`)
| Method | Path | Auth | Permission |
|---|---|---|---|
| GET | `/` | 🔓 | — |
| GET | `/:id` | 🔓 | — |
| POST | `/` | 🔑 | `products:create` |
| PUT | `/:id` | 🔑 | `products:update` |
| DELETE | `/:id` | 🔑 | `products:delete` |

### Orders (`/api/orders`)
| Method | Path | Auth | Permission | Notes |
|---|---|---|---|---|
| POST | `/` | 🔑 | `orders:create` | userId taken from JWT, never client-supplied |
| GET | `/` | 🔑 | — | all orders if `orders:read:all`, else only the caller's own |
| GET | `/:id` | 🔑 | — | ownership check unless `orders:read:all` |
| PATCH | `/:id/status` | 🔑 | `orders:update:status` | only `PROCESSING`/`SHIPPED`/`DELIVERED`, only from `PAID`/`PROCESSING`/`SHIPPED` |
| POST | `/:id/cancel` | 🔑 | `orders:update:status` | body `{ reason }`, restores stock if already paid, emails customer |

### Inventory (`/api/inventory`)
| Method | Path | Auth | Permission | Notes |
|---|---|---|---|---|
| GET | `/movements` | 🔑 | `inventory:read` | optional `?productId=` filter |
| POST | `/movements` | 🔑 | `inventory:adjust` | body `{ productId, type: IN\|OUT\|ADJUSTMENT, quantity, reason }` — `ADJUSTMENT`'s quantity is the new absolute stock count, not a delta |

### Security (`/api/security`)
| Method | Path | Auth | Permission | Notes |
|---|---|---|---|---|
| GET | `/events` | 🔑 | `users:manage` | most recent 200 login/logout/suspicious events |

### Payments — Paystack (`/api/payments/paystack`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/initialize` | 🔑 | body `{ orderId }`, must own the order |
| POST | `/webhook` | 🔓 | HMAC-signature verified, called by Paystack |
| GET | `/verify/:reference` | 🔑 | must own the order |

### Payments — M-Pesa / Daraja (`/api/payments/mpesa`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/stk-push` | 🔑 | body `{ orderId, phone }`, must own the order |
| POST | `/callback` | 🔓 | called by Safaricom; only transitions existing `PENDING` payments |

## Running locally

```
cd server
npm install
npx prisma migrate dev   # applies schema
npx prisma db seed       # seeds roles/permissions/super admin/255 products
npm run dev               # tsx watch src/server.ts on :3001
```

Copy `.env.example` to `.env` and fill in real values (JWT secrets, Daraja/Paystack keys, SMTP config) before running.

To run frontend + backend together, see the root `README.md` (`npm run dev:all` or `npm run dev:split`). `docker-compose.yml` at the repo root brings up Postgres + Mailpit + both services in containers.

**Prisma generator note**: `schema.prisma`'s `generator client` block sets `moduleFormat = "cjs"`, and `tsconfig.json` sets `rewriteRelativeImportExtensions: true`. Both are required — without them, the compiled `dist/` output crashes on boot (`Cannot use 'import.meta' outside a module`, then `Cannot find module './internal/class.ts'`) because Prisma 7's newer `prisma-client` generator emits ESM-flavored, `.ts`-extension-importing TypeScript by default, which only works transparently under `tsx`, not a plain `tsc` build. Caught by testing the compiled output in a real container — don't remove either setting.

The server shuts down gracefully on `SIGINT`/`SIGTERM` (stops accepting connections, disconnects Prisma, clears the scheduler, force-exits after 10s if something hangs) so the port is always freed — no more stray processes holding `:3001`.

**Seeding a container/Render deployment**: the production image is intentionally lean and doesn't include `tsx` (a devDependency), so `npx prisma db seed` fails there with `spawn tsx ENOENT`. Either run `npx prisma db seed` from your local machine against the deployment's `DATABASE_URL`, or run `npx --yes tsx prisma/seed.ts` inside the container/service shell (fetches `tsx` on demand). Verified working via `docker compose exec backend npx --yes tsx prisma/seed.ts`.
