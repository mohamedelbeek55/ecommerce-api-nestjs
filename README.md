# E-Commerce API 🛒

[![CI](https://github.com/mohamedelbeek55/ecommerce-api-nestjs/actions/workflows/ci.yml/badge.svg)](https://github.com/mohamedelbeek55/ecommerce-api-nestjs/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)
![NestJS](https://img.shields.io/badge/NestJS-12-ea2845)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![License](https://img.shields.io/badge/license-MIT-green)

> A production-grade REST API for an e-commerce platform, built with **NestJS**, **PostgreSQL**, and **Prisma**, following **Clean Architecture** principles. Deployed on **Railway** + **Neon**.

## 🎮 Try It Live

**Live Swagger UI:** [https://ecommerce-api-nestjs-production-f953.up.railway.app/api/docs](https://ecommerce-api-nestjs-production-f953.up.railway.app/api/docs)

**Test Credentials:**

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | `admin@demo.local` | `Admin@123456` |
| 👤 Customer | `customer@demo.com` | `Customer@123456` |


> 💡 Click **"Authorize"** in Swagger, login with the credentials above, and try the endpoints directly.

> 🎥 **Quick Start:** 1) Login → 2) Copy `accessToken` → 3) Click **Authorize** → 4) Paste token → 5) Try any endpoint


**[🐛 Report Bug](https://github.com/mohamedelbeek55/ecommerce-api-nestjs/issues)** · **[✨ Request Feature](https://github.com/mohamedelbeek55/ecommerce-api-nestjs/issues)**

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Features

### 🔐 Authentication & Security

- **JWT authentication** with access + refresh tokens
- **Email verification** with expiring single-use tokens (24h)
- **Password reset flow** with secure random tokens (15-min expiry)
- **Role-Based Access Control** (Admin / Customer)
- **Per-endpoint rate limiting** (throttling) on sensitive routes
- **bcrypt password hashing** (12 rounds)
- **Refresh sessions are revoked** on password reset and logout
- **Anti user-enumeration** on password-reset and resend-verification (always `204`)

### 🛍️ Catalog

- Products with **search (case-insensitive name match), price/category filtering, sorting, and pagination**
- Categories management (admin-only CRUD)
- Stock tracking with atomic updates

### 🛒 Shopping Cart

- **Persistent cart per user** (auto-created on first access)
- Add / update / remove items with quantity validation
- Subtotal and total calculation using `Prisma.Decimal` (no floating-point rounding errors)

### 📦 Orders

- **Atomic checkout** with stock validation and rollback on failure
- **Concurrency-safe stock handling**: prevents overselling under parallel requests
- Order history per user
- Order ownership verification (`404` instead of `403`)

### 💳 Payments

- **Stripe PaymentIntent** integration
- **Webhook handling** with cryptographic signature verification
- **Idempotency keys** to prevent duplicate PaymentIntents
- **Idempotent webhook processing** (processed event IDs are stored)
- Automatic order status transition based on payment events
- **Raw body parsing** for the webhook endpoint

### 📧 Email

- Responsive **HTML email templates**
- Verification and password-reset emails with styled call-to-action buttons
- SMTP integration (Nodemailer) — works with Gmail, Brevo, SendGrid, Resend, etc.

### 🧪 Quality & DevOps

- **Unit tests** (Jest) for business logic
- **E2E tests** against a real PostgreSQL database
- **Concurrency tests** for checkout race conditions
- **CI pipeline** (GitHub Actions): lint, unit tests, e2e tests, build, and Docker image build
- **Swagger / OpenAPI 3** documentation for the endpoints
- **Multi-stage Docker build** with a non-root runtime user
- **Environment validation** with Zod (fails fast on startup)
- **Live deployment** on Railway with auto-migrations on startup

---

## Architecture

This project follows **Clean Architecture** combined with **Domain-Driven Design** principles.

```text
┌─────────────────────────────────────────────────────────┐
│ Controllers (HTTP Layer)                                │
│  - Request validation via DTOs                          │
│  - Swagger decorators                                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Services (Application Layer)                            │
│  - Business logic                                       │
│  - Depends on repository INTERFACES, not implementations│
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Domain Layer                                            │
│  - Entities                                             │
│  - Repository interfaces (abstract classes)             │
└────────────────────▲────────────────────────────────────┘
                     │ implements
┌────────────────────┴────────────────────────────────────┐
│ Infrastructure Layer                                    │
│  - Prisma implementations of repositories               │
│  - Data access lives here                               │
└─────────────────────────────────────────────────────────┘
```

### Why this architecture?

- ✅ **Testability**: services can be unit-tested with mocked repositories (no database needed)
- ✅ **Isolated data access**: all queries live in `infrastructure/`, which limits the blast radius of an ORM change
- ✅ **Clear boundaries**: business logic stays out of controllers and query code
- ✅ **Dependency Inversion**: high-level modules depend on abstractions, not on Prisma

Each feature module (`auth`, `users`, `products`, `cart`, `orders`, `payments`, `categories`) is organized like this:

```text
feature/
├── domain/               # Entities + repository interfaces
├── infrastructure/       # Prisma implementations
├── dto/                  # Request/Response DTOs (validation + Swagger)
├── feature.service.ts    # Business logic
├── feature.controller.ts # HTTP endpoints
└── feature.module.ts     # Dependency wiring
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [NestJS 12](https://nestjs.com) |
| **Language** | TypeScript 6 |
| **Database** | PostgreSQL 16 |
| **ORM** | [Prisma 7](https://www.prisma.io) |
| **Authentication** | JWT + Passport (access + refresh) |
| **Validation** | class-validator + class-transformer |
| **API Docs** | Swagger / OpenAPI 3 |
| **Payments** | [Stripe](https://stripe.com) |
| **Email** | Nodemailer (SMTP) |
| **Rate Limiting** | @nestjs/throttler |
| **Env Validation** | Zod |
| **Testing** | Jest + Supertest |
| **Container** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Linting** | oxlint + Prettier |

---

## Getting Started

### Prerequisites

- **Node.js** >= 24.9
- **npm** >= 10
- **Docker** + **Docker Compose**

### Option 1: Quick start with Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/mohamedelbeek55/ecommerce-api-nestjs.git
cd ecommerce-api-nestjs

# 2. Create your env file
cp .env.example .env
# Edit .env and fill in your values (see "Environment Variables" below)

# 3. Start PostgreSQL + the API
docker compose up -d

# 4. Open the API docs
# http://localhost:3000/api/docs
```

### Option 2: Local development

```bash
# 1. Clone & install
git clone https://github.com/mohamedelbeek55/ecommerce-api-nestjs.git
cd ecommerce-api-nestjs
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# Fill in the values

# 3. Start only the database in Docker
docker compose up -d postgres

# 4. Run migrations & generate the Prisma client
npx prisma migrate dev
npx prisma generate

# 5. Start in watch mode
npm run start:dev

# 6. Open Swagger
# http://localhost:3000/api/docs
```

### Available scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run start:prod` | Start in production mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Lint with oxlint |
| `npm run format` | Format with Prettier |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (uses a dedicated test database) |
| `npm run test:cov` | Run unit tests with coverage |
| `npx prisma studio` | Open the database GUI |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5433/ecommerce_db` |
| `POSTGRES_PASSWORD` | Password for the Postgres container (Docker Compose) | — |
| `JWT_ACCESS_SECRET` | Access token secret (32+ chars) | generated, see below |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars, different from the access secret) | generated, see below |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `you@gmail.com` |
| `EMAIL_PASS` | SMTP password (App Password for Gmail) | — |
| `EMAIL_FROM` | Sender address | `noreply@yourdomain.com` |
| `EMAIL_SECURE` | Use implicit TLS (`true` for port 465) | `false` |
| `FRONTEND_URL` | Frontend base URL, used to build links in emails | `http://localhost:3000` |

> 💡 Generate secure secrets with:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## API Documentation

Interactive Swagger UI is available at:

- **Production:** [https://ecommerce-api-nestjs-production-f953.up.railway.app/api/docs](https://ecommerce-api-nestjs-production-f953.up.railway.app/api/docs)
- **Local:** http://localhost:3000/api/docs


Swagger documents each endpoint with:

- ✅ Request body schemas and examples
- ✅ Possible response codes
- ✅ Authentication requirements
- ✅ "Try it out" with JWT support

### API overview

All routes are served under the `/api/v1` prefix.

| Resource | Endpoints |
|----------|-----------|
| **Auth** | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password` |
| **Users** | `GET /users/me`, `PATCH /users/me` |
| **Products** | `GET /products` (paginated, searchable), `GET /products/:id`, `GET /products/category/:categoryId`, `POST` / `PATCH` / `DELETE` (admin) |
| **Categories** | `GET /categories`, `GET /categories/:id`, `POST` / `PATCH` / `DELETE` (admin) |
| **Cart** | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` |
| **Orders** | `POST /orders/checkout`, `GET /orders`, `GET /orders/:id` |
| **Payments** | `POST /payments/orders/:orderId/intent`, `POST /payments/webhook` (called by Stripe) |
| **Health** | `GET /health` |

---

## Testing

This project uses Jest for both unit and E2E tests.

### Unit tests

Test business logic in isolation with mocked dependencies:

```bash
npm test
```

### E2E tests

Run the full HTTP stack against a real PostgreSQL test database:

```bash
npm run test:e2e
```

The E2E runner (`test/run-e2e.cjs`):

1. Creates the `ecommerce_test` database if it doesn't exist
2. Applies all Prisma migrations to it
3. Runs Jest with `--runInBand` to avoid database race conditions

### Coverage

```bash
npm run test:cov
```

### Test strategy

| Layer | Type | What's tested |
|-------|------|---------------|
| Services | Unit | Business logic, error handling, edge cases |
| Controllers | E2E | HTTP status codes, request validation, auth |
| Database | E2E | Real queries, constraints, transactions |
| Concurrency | E2E | Checkout race conditions, PaymentIntent creation |

---

## Deployment

The API is deployed on **Railway** (backend) with **Neon** (PostgreSQL).

| Component | Provider | Notes |
|-----------|----------|-------|
| Backend | [Railway](https://railway.app) | Docker container, free tier |
| Database | [Neon](https://neon.tech) | Serverless PostgreSQL |
| CI/CD | GitHub Actions | Auto-deploy on push to `main` |

**Production URL:** [https://ecommerce-api-nestjs-production-f953.up.railway.app](https://ecommerce-api-nestjs-production-f953.up.railway.app)

Migrations run automatically at container startup (`prisma migrate deploy`).


## Project Structure

```text
.
├── .github/workflows/          # CI pipeline
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
├── src/
│   ├── auth/                   # Authentication & authorization
│   ├── cart/                   # Shopping cart
│   ├── categories/             # Product categories
│   ├── config/                 # Env validation (Zod)
│   ├── database/               # Prisma service
│   ├── email/                  # Email service + templates
│   ├── health/                 # Health check endpoint
│   ├── orders/                 # Order management
│   ├── payments/               # Stripe integration
│   ├── products/               # Product catalog
│   ├── users/                  # User profile
│   ├── app.module.ts
│   └── main.ts
├── test/                       # E2E tests + helpers
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # Local stack (Postgres + API)
└── package.json
```

---

## Roadmap

- [x] JWT authentication with refresh tokens
- [x] Email verification + password reset
- [x] Role-based access control
- [x] Product catalog with search + pagination
- [x] Shopping cart
- [x] Order management with concurrency-safe checkout
- [x] Stripe payments + webhooks
- [x] Swagger documentation
- [x] Docker + CI
- [x] Unit + E2E tests

---

## Contributing

This is a personal portfolio project, but feedback is welcome! Feel free to:

- Open an issue
- Submit a pull request
- Reach out via LinkedIn

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Author

**Mohamed Elbeek**

- GitHub: [mohamedelbeek55](https://github.com/mohamedelbeek55)
- LinkedIn: [Mohamed Elbeek](https://www.linkedin.com/in/mohamed-elbeek-9b81a230b/)
- Email: mohamed.elbeek88@gmail.com

⭐ If you found this project helpful, please give it a star!
