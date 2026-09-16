# E-Commerce API

NestJS 12 + Prisma 7 + PostgreSQL e-commerce backend using a strict
Controller → Service → Repository architecture.

## Features

- JWT access/refresh authentication with bcrypt, RBAC, throttling, and Helmet.
- Public product/category reads and admin catalog writes.
- Product pagination, filtering, search, and sorting.
- Authenticated per-user carts with Decimal-safe totals.
- Transactional checkout with atomic stock decrement and concurrency protection.
- Stripe test-mode PaymentIntents with signed, idempotent webhooks.
- Swagger/OpenAPI documentation at `/api/docs`.
- Unit and real-PostgreSQL E2E tests.

## Requirements

- Node.js `>=24.9.0`
- Docker Desktop (for PostgreSQL and the containerized stack)

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npx prisma migrate deploy
npm run start:dev
```

The API is available at `http://localhost:3000/api/v1`.
Health: `GET /api/v1/health`.
Swagger: `http://localhost:3000/api/docs`.
Swagger groups endpoints by Auth, Health, Users, Products, Categories, Cart,
Orders, and Payments; use the Authorize button for bearer-token routes.

Fill in real Stripe test credentials in `.env` before using PaymentIntent
creation against Stripe. Never commit `.env`.

## Tests and checks

```bash
npm test
npm run test:e2e
npm run lint
npm run build
npm audit
```

The E2E runner creates and migrates a separate `ecommerce_test` database
inside the configured PostgreSQL server, so local development data is not
used by tests.

## Docker

Run the complete local stack:

```bash
docker compose up --build
```

The API container applies committed Prisma migrations before starting.
Override the placeholder JWT and Stripe values through a production secret
manager; the compose values are for local development only.

## Architecture

Each feature follows:

```text
Controller → Service → abstract repository token → Prisma repository
```

Services contain business rules and exception translation. Controllers handle
HTTP I/O. Prisma imports remain in infrastructure repositories except for
Decimal/domain types required for safe money calculations.
