# Project Context — E-Commerce API (NestJS)

> **Read this file first**, whether you are Claude, DeepSeek, Kiro, Cursor, or any other AI assistant picking up this project. It should let you get fully up to speed without the developer having to re-explain everything from scratch.

## 1. What this project actually is

This is a **training / portfolio project**, not a graduation project and not a client deliverable (yet). The developer (Mohamed) has a solid NestJS foundation and a MongoDB background, and is using this project for two goals at once:

1. Learn to use AI coding assistants **professionally** — as a tool that speeds up deliberate, reasoned engineering decisions, not as a black box that gets blindly copy-pasted.
2. Produce a genuinely production-quality E-Commerce API to put in a freelance portfolio.

Both goals matter equally. Code quality, security, and testing are not optional "nice to haves" here — they're the point of the exercise.

## 2. Tech stack

- **Framework:** NestJS 12
- **Language:** TypeScript
- **Database:** PostgreSQL (developer's primary background is MongoDB — this project is deliberately on Postgres to build relational-modeling skills)
- **ORM:** Prisma — **stable v7.x line only**. See section 5, this is a hard constraint.
- **Env validation:** Zod (chosen over Joi for native `z.infer` type inference — one schema, one source of truth for the `Env` type)
- **DTO validation:** class-validator + class-transformer (standard NestJS pairing, different responsibility from env validation)
- **Testing:** Jest (unit + integration + e2e)
- **Implemented:** Stripe test-mode payments, Docker + docker-compose development/runtime setup, GitHub Actions CI with unit, e2e, lint, and build checks

## 3. How AI tools are used on this project

Multiple AI tools are in play:
- **Claude** (web chat) — architectural reasoning, prompt design, code review, keeping the overall plan coherent.
- **DeepSeek** (VS Code extension) — writes the actual code from prompts Claude designs.
- **Kiro IDE** — also used for building/iterating on the project.

**Workflow that must be followed for every new feature:**
1. Discuss the requirement/architecture decision with Claude first.
2. Claude gives the reasoning and a precise, scoped prompt.
3. Paste that prompt into DeepSeek/Kiro; let it generate the code.
4. Bring the resulting code back to Claude for review (security, quality, test coverage, whether it matches the agreed architecture).
5. Only then move to the next step.

**Golden rule (learned the hard way — see section 5):** if an AI assistant proposes a large, multi-file rewrite to work around a tooling or dependency problem, **stop and ask whether there's a simpler fix** (e.g., pinning a different package version) before letting it rewrite application code to chase a moving target.

## 4. Architecture decisions (with reasoning, so nobody "fixes" these by accident)

- **Repository Pattern**, using an **abstract class** (not a TypeScript `interface`) as the NestJS DI token. Interfaces are erased at compile time; NestJS's DI container needs a real runtime symbol to inject against, so an abstract class is used instead. Services depend only on the abstract repository (e.g. `IProductRepository`), never directly on Prisma.
  - This isolates the database layer so a future ORM/DB switch (e.g. back to MongoDB) only requires a new implementation class, not changes to controllers/services/business logic.
  - Important honesty check: this does **not** make a database migration "free". Postgres and MongoDB require fundamentally different data modeling (relational vs. embedded documents, real foreign keys vs. none, different transaction semantics). The pattern limits the blast radius of a migration — it doesn't eliminate the work.
- **Layered architecture:** Controller (I/O only, no business logic) → Service (all business logic) → Repository (data access only).
- **DTOs** on every input, validated via `class-validator` + a global `ValidationPipe` with `whitelist: true` (reject unexpected fields).
- **Env validation via Zod**, wired into `@nestjs/config`'s `validate` option, so the app fails fast on startup with a clear error if a required variable is missing or malformed.
- **Rate limiting and security headers:** a global throttling default limits clients to 20 requests per 60 seconds per IP, while the register, login, and refresh endpoints use a stricter 5 requests per 60 seconds per IP override. This specifically reduces brute-force and credential-stuffing risk on authentication write endpoints, not just general abuse. Helmet also applies baseline HTTP security headers at bootstrap.

## 5. ⚠️ Known issue and decision: Prisma version

**What happened:** during Phase 1 setup, an AI coding session installed `prisma` CLI as `^8.0.0-rc.14` while `@prisma/client` stayed at `^7.10.0` — a mismatched pair. Instead of flagging the mismatch, the assistant chased the RC's undocumented, still-changing API (`contract.prisma`, PSL, `db.orm.public.Product.where(...)`, Temporal-based timestamps, a custom `prisma.config.ts` `orm` section) through dozens of trial-and-error steps, rewriting `PrismaService`, the repository implementation, and the entity types around it.

**Verified fact:** Prisma ORM v8 is a real, legitimate rewrite the Prisma team is actively building (new TypeScript runtime, contract-based schema, new query API). It is *not* a hallucination. However, as of now it is still **pre-GA (Release Candidate)**, and its API has kept making intentionally breaking changes between RC point releases — including very recently.

**Decision:** for a project meant to look professional and be maintainable by any future freelance client or teammate, **standardize on the stable Prisma v7.x line** — classic `schema.prisma` (generator + datasource blocks), `prisma generate`, `PrismaClient` extended directly in `PrismaService`, and `prisma.product.findMany()`-style queries. This is what any NestJS developer or client will recognize immediately, and it won't need a rewrite every time Prisma ships a new RC.

Prisma v8 can be revisited later, once it reaches stable/GA, as a **deliberate, separate upgrade exercise** — not as the foundation this first portfolio project is built on.

**Status: this migration was completed on 2026-09-14.** `prisma/schema.prisma` (standard v7 syntax) is the live schema, with working migrations applied against the local Postgres database. See `ROADMAP.md` for the current phase status.

## 6. Folder structure (as of 2026-09-14)

```
src/
  app.module.ts       → wires everything together; global guards (Throttler → JwtAuth → Roles) via APP_GUARD
  main.ts              → helmet, global ValidationPipe, raw-body Stripe support, Swagger at /api/docs, 'api/v1' prefix
  config/              → env.validation.ts (Zod schema + validate() + Env type)
  database/             → PrismaService (pg driver adapter) + DatabaseModule (@Global)
  health/               → GET /health, public, custom PrismaService-based check (no @nestjs/terminus)
  auth/                 → register/login/refresh/logout, JWT access+refresh, RBAC guards, rate-limited write endpoints
    decorators/          → @Public(), @Roles(), @CurrentUser()
    guards/               → JwtAuthGuard, RefreshJwtGuard, RolesGuard (+ *.guard.spec.ts)
    strategies/            → JwtStrategy, JwtRefreshStrategy
    dto/                    → RegisterDto, LoginDto, RefreshDto
    auth.service.spec.ts     → full unit coverage
  users/                 → self-service profile: GET/PATCH /users/me (name only), done + tested (2026-09-14) — no admin user management (deferred)
    dto/                 → UpdateProfileDto
  products/              → full CRUD, public reads / admin writes, pagination/filtering/search on GET /, done + tested (2026-09-14)
    domain/, infrastructure/, dto/
  categories/             → full CRUD, public reads / admin writes, done + tested (mirrors products/ exactly)
    domain/, infrastructure/, dto/
  cart/                  → authenticated per-user cart, Decimal-safe totals, done + tested (2026-09-14)
    domain/, infrastructure/, dto/
  orders/                → authenticated checkout and order history, transactional stock decrement, done + tested (2026-09-14)
    domain/, infrastructure/, orders.service/controller/module, orders.service.spec.ts
  payments/              → Stripe test-mode PaymentIntents and signed idempotent webhooks, done + tested (2026-09-14)
prisma/
  schema.prisma          → v7 generator+datasource blocks; User, Category, Product, Cart, CartItem, Order, OrderItem, ProcessedStripeEvent models
  migrations/
    20260914022716_add_orders/ → applied Order/OrderItem schema migration
    20260914161000_add_payment_fields/ → applied Stripe payment fields and webhook event migration
.github/workflows/
  ci.yml                 → Node 24.9 + Postgres service → npm ci → Prisma generate → e2e → lint → unit test → build
Dockerfile              → multi-stage Node 24.9 production image
docker-compose.yml      → Postgres 16 + API runtime with migration deployment
```

Every future module should follow the same three-piece pattern: `domain/<name>.entity.ts` + `domain/<name>.repository.interface.ts` + `infrastructure/prisma-<name>.repository.ts`, wired in `<name>.module.ts` via `{ provide: I<Name>Repository, useClass: Prisma<Name>Repository }`.

## 7. Orders and checkout behavior

- Checkout is authenticated and scoped to the current user; controllers never accept a user ID from the request body.
- `POST /orders/checkout` reads the user's cart, rejects an empty cart, conditionally decrements every product stock, creates the order, and clears cart items in one Prisma transaction.
- A conditional `updateMany` with `stock >= quantity` prevents a concurrent checkout from driving stock below zero. Any failed item aborts the entire transaction.
- Order items store immutable product name and price snapshots, so later catalog changes do not alter order history.
- Money remains `Prisma.Decimal` during calculations and is serialized to strings at the service boundary.
- The current order statuses are `PENDING`, `CONFIRMED`, `CANCELLED`, and `COMPLETED`; payment-driven transitions are implemented, while fulfillment-driven `COMPLETED` transitions remain deferred.

## 8. Payments and webhook security

- Stripe credentials are loaded through Zod-validated environment variables and are never hardcoded.
- `POST /payments/orders/:orderId/intent` is authenticated and only accepts orders owned by the current user while they are `PENDING`.
- Payment amounts are converted from `Prisma.Decimal` to integer USD cents before calling Stripe.
- The webhook route is public only because Stripe must reach it, but it verifies the exact raw request bytes with `stripe-signature` and `STRIPE_WEBHOOK_SECRET`.
- Only signed `payment_intent.succeeded` and `payment_intent.payment_failed` events can change an order.
- Processed Stripe event IDs are stored under a unique primary key, and event recording plus the conditional `PENDING` status transition run in one transaction. Duplicate delivery is therefore harmless.
- PaymentIntent creation reuses an associated intent and also sends an order-derived Stripe idempotency key, preventing duplicate charges from repeated or concurrent requests.

## 9. Conventions

- Conversation/planning with Claude happens in Egyptian Arabic; all code, comments, commit messages, and documentation stay in English (standard practice, readable by any client or employer).
- No secrets ever hardcoded — everything through `.env` (see `.env.example` for the required variables).

## 10. ⚠️ Known issue and decision: secrets hygiene

**What happened:** during the hardening pass, a full security review (2026-09-14) found that `.env.example` — the file meant to be committed to this public portfolio repo — contained the exact same `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` values as the real local `.env`. Whoever wrote the example file originally copy-pasted the real generated secrets instead of writing placeholders.

**Fix applied:** `.env` was rotated to two freshly generated random secrets; `.env.example` now has obviously-non-functional placeholder text plus an `openssl rand -hex 32` instruction.

**Standing rule going forward:** `.env.example` must never contain a value that would actually work if pasted into `.env` as-is — no real-looking hex/base64 strings, even as "just an example." Use description text (`replace-with-...`) instead. Before any push to the public remote, sanity-check `.env.example` doesn't contain live-looking secrets, the same way the Prisma-version check in section 5 became a standing habit.

## 11. ⚠️ Known issue and decision: Jest + NestJS 12 ESM interop

**What happened:** NestJS 12's official packages are pure ESM (`"type": "module"`). Jest's own module loader doesn't use Node's native `require(esm)` support automatically — it needs `--experimental-vm-modules` in `NODE_OPTIONS` even on a Node version that supports it natively (confirmed on Node v25.2.1).

**Decision:** enabled the flag only for the Jest test scripts (`test`, `test:watch`, `test:cov`) via `cross-env` in `package.json`. The application itself, `tsconfig.json`, and `jest.config.ts`'s CommonJS transform were NOT changed — this is a test-runner-only interop fix, not an ESM migration.

## 12. Where to find the plan

See `ROADMAP.md` in the project root for phase-by-phase status and the immediate next action.
