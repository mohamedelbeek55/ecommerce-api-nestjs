# E-Commerce API 🛒

[![CI](https://github.com/mohamedelbeek55/ecommerce-api-nestjs/actions/workflows/ci.yml/badge.svg)](https://github.com/mohamedelbeek55/ecommerce-api-nestjs/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![NestJS](https://img.shields.io/badge/NestJS-12-ea2845?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Neon](https://img.shields.io/badge/Neon-Serverless_DB-00E599?logo=neon)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)
![Hostless](https://img.shields.io/badge/Hostless-Deployed-6366f1)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)
![Jest](https://img.shields.io/badge/Tested_with-Jest-C21325?logo=jest)
![License](https://img.shields.io/badge/license-MIT-green)

> A production-grade, highly resilient REST API for an e-commerce platform built with **NestJS 12**, **PostgreSQL (Neon)**, **Prisma 7**, and **Docker**. Architected with **Clean Architecture** & **Domain-Driven Design (DDD)** principles to guarantee concurrency safety, financial decimal precision, and high security.

---

## 🎮 Try It Live

- **Interactive Swagger UI:** [https://ecommerce-api.hostless.app/api/docs](https://ecommerce-api.hostless.app/api/docs)
- **Frontend Companion (Storefront):** [https://ecommerce-frontend-nqbt.vercel.app/](https://ecommerce-frontend-nqbt.vercel.app/) (Angular 21 Signals + Tailwind CSS)
- **Production API URL:** `https://ecommerce-api.hostless.app/api/v1`

### 🔑 Test Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| 👑 **Admin** | `admin@demo.com` | `Admin@123456` | Full catalog, categories & inventory management |
| 👤 **Customer** | `customer@demo.com` | `Customer@123456` | Cart, atomic checkout, Stripe payments, orders |

> 💡 **Quick Test:**
> 1. Open [Swagger UI](https://ecommerce-api.hostless.app/api/docs).
> 2. Call `POST /api/v1/auth/login` with either credential above.
> 3. Copy the returned `accessToken`.
> 4. Click **Authorize** at the top right, enter the Bearer token, and test any protected endpoint.

---

## 📑 Table of Contents

- [Core Engineering Highlights](#-core-engineering-highlights)
- [System Architecture](#-system-architecture)
- [Database Schema (ERD)](#-database-schema-erd)
- [Features](#-features)
- [Visual Previews](#-visual-previews)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Testing & Concurrency Verification](#-testing--concurrency-verification)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Author](#-author)

---

## 🛡️ Core Engineering Highlights

### 1. Concurrency-Safe Checkout & Race Condition Prevention
In high-traffic e-commerce systems, concurrent purchases of the last inventory unit often lead to negative stock (overselling). 
- **The Solution:** Checkout executes inside an **interactive ACID transaction** using **atomic conditional updates**:
  ```sql
  UPDATE products 
  SET stock = stock - :quantity 
  WHERE id = :productId AND stock >= :quantity
  ```
  If affected rows count is `0`, the entire checkout transaction aborts instantly and throws `InsufficientStockError`, keeping the inventory completely consistent.
- **Verified with Concurrency E2E Tests:** A dedicated test suite fires parallel checkout requests for the last single item using `Promise.all`. It asserts that exactly one request succeeds (`201`), the other fails (`400 Insufficient stock`), and inventory terminates cleanly at `0`.

### 2. Idempotent Payments & Cryptographic Webhooks
- **Double-Charge Protection:** In-flight Promise lock (`paymentIntentCreationLocks`) combined with deterministic `idempotencyKey` passed to Stripe prevents duplicate PaymentIntents from rapid multi-clicks.
- **Signed Webhook Ingestion:** Reconstructs and cryptographically verifies raw request bytes with Stripe's signature (`stripe-signature`).
- **Idempotent Event Storage:** Webhook event IDs are saved in `processed_stripe_events` table under a unique constraint. Re-delivered webhook attempts exit gracefully without mutating order states twice.
- **Amount & Currency Validation:** Verifies that the paid amount and currency received from Stripe strictly match the calculated order total before moving orders to `CONFIRMED`.

### 3. Financial Decimal Precision (Zero Floating-Point Drift)
- Financial numbers in JavaScript are notorious for rounding inaccuracies (e.g. `0.1 + 0.2 !== 0.3`).
- All product prices, cart subtotals, and order totals are calculated using `Prisma.Decimal` and stored as `@db.Decimal(10, 2)` in PostgreSQL.
- Converted to exact integer cents only at the Stripe boundary.
- **Historical Immutability:** Orders store independent price and product name snapshots at purchase time in `order_items`, ensuring historical ledger accuracy even if catalog prices change later.

### 4. Clean Architecture & Dependency Inversion
- Domain services never talk directly to the Prisma ORM.
- **Abstract Classes as DI Tokens:** Interfaces are erased at TypeScript compile time. We use abstract classes (`IOrderRepository`, `IProductRepository`) as runtime injection tokens in NestJS. Swapping database providers or testing with mock repositories requires zero changes to domain business logic.

### 5. Security & Defense-in-Depth
- **Tiered Throttling:** Baseline rate-limiting of 20 req/min globally, with strict 5 req/min on sensitive write routes (login, register, refresh) to mitigate brute-force and credential-stuffing.
- **Anti User-Enumeration:** Password reset and verification resend endpoints return identical `204 No Content` responses regardless of whether the email exists in the database.
- **Fail-Fast Configuration:** All environment variables are validated at boot time with **Zod** (`z.infer`), halting container startup immediately with descriptive logs if a variable is missing or invalid.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client([Client Apps / Frontend / Postman]) -->|HTTP / JSON| Controller[Controller Layer<br/>• DTO Validation / Whitelist<br/>• Swagger Docs & Guard Enforcement]
    
    Controller -->|Calls Application Use Cases| Service[Service Layer - Domain Logic<br/>• Business Rules & Transactions<br/>• Decimal Calculations<br/>• Error Handling]
    
    Service -->|Injects Abstraction| IRepo[Abstract Repository Contract<br/>e.g. IOrderRepository]
    
    PrismaRepo[Prisma Infrastructure Repository<br/>e.g. PrismaOrderRepository] -.->|Implements| IRepo
    
    PrismaRepo -->|Prisma Client / pg Driver Adapter| DB[(PostgreSQL Database<br/>Neon Serverless)]
    Service -->|Stripe SDK / Webhooks| Stripe([Stripe Gateway])
    Service -->|Nodemailer / SMTP| Mail([Email Service])

    classDef controller fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef service fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef repo fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef db fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    class Controller controller;
    class Service service;
    class IRepo,PrismaRepo repo;
    class DB,Stripe,Mail db;
```

### Concurrency-Safe Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    actor CustomerA as Customer A
    actor CustomerB as Customer B
    participant OrdersController as Orders Controller
    participant OrdersService as Orders Service
    participant DB as PostgreSQL Transaction

    Note over DB: Product Stock = 1 unit left
    CustomerA->>OrdersController: POST /orders/checkout (Concurrent)
    CustomerB->>OrdersController: POST /orders/checkout (Concurrent)

    OrdersController->>OrdersService: checkout(userA)
    OrdersController->>OrdersService: checkout(userB)

    OrdersService->>DB: BEGIN Transaction A
    OrdersService->>DB: BEGIN Transaction B

    DB-->>CustomerA: Atomic Update (Stock >= 1) -> Success (Stock becomes 0)
    DB-->>CustomerB: Atomic Update (Stock >= 1) -> Affected Rows = 0!

    OrdersService->>DB: Transaction A COMMIT (Order Created)
    OrdersService->>DB: Transaction B ROLLBACK (Abort)

    OrdersController-->>CustomerA: 201 Created (Order Placed)
    OrdersController-->>CustomerB: 400 Bad Request (Insufficient stock)
```

---

## 🗄️ Database Schema (ERD)

```mermaid
erDiagram
    User ||--o| Cart : owns
    User ||--o{ Order : places
    Category ||--o{ Product : categorizes
    Product ||--o{ ProductImage : contains
    Product ||--o{ CartItem : added_in
    Cart ||--o{ CartItem : holds
    Order ||--o{ OrderItem : details
    
    User {
        string id PK
        string email UK
        string password
        string name
        enum role
        string hashedRefreshToken
        boolean isEmailVerified
        datetime createdAt
    }

    Product {
        string id PK
        string name
        string description
        decimal price
        int stock
        string categoryId FK
        datetime createdAt
    }

    ProductImage {
        string id PK
        string url
        string publicId
        string productId FK
    }

    Cart {
        string id PK
        string userId FK, UK
        datetime updatedAt
    }

    CartItem {
        string id PK
        string cartId FK
        string productId FK
        int quantity
    }

    Order {
        string id PK
        string userId FK
        enum status
        decimal total
        string stripePaymentIntentId UK
        datetime createdAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId
        string productName
        decimal unitPrice
        int quantity
        decimal subtotal
    }

    ProcessedStripeEvent {
        string id PK
        datetime processedAt
    }
```

---

## 📸 Visual Previews

### 1. Interactive Swagger / OpenAPI Documentation
> Fully documented endpoints with request/response schemas, JWT authorization button, and live "Try it out" capability.

![Swagger UI Documentation](docs/images/swagger.png)

---

### 2. Concurrency E2E Test Suite (Zero Overselling Guarantee)
> Real-time terminal execution of concurrent checkout race conditions testing two parallel users competing for the last inventory item.

![Passing Concurrency Tests](docs/images/concurrency-test.png)

---

### 3. Automated CI/CD Pipeline (GitHub Actions)
> Automated continuous integration pipeline executing Linter (`oxlint`), Unit Tests, E2E Database Tests, and Production Container Build.

![GitHub Actions CI Pipeline](docs/images/ci-pipeline.png)

---

## 🛍️ Features

### 🔐 Authentication & Access Control
- JWT Access & Refresh Token rotation.
- Hashed refresh tokens stored in database with instant revocation upon logout or password reset.
- Role-Based Access Control (`ADMIN`, `CUSTOMER`) via NestJS Guards.
- Single-use email verification tokens (24h expiry) & password reset tokens (15m expiry).
- Anti user-enumeration defenses (uniform `204` responses).

### 📦 Catalog & Inventory
- Public catalog with full-text case-insensitive search, price filters, category filtering, sorting, and pagination.
- Admin-restricted CRUD operations for products and categories.
- Stock tracking with atomic database updates.

### 🛒 Shopping Cart & Orders
- User-scoped persistent cart (auto-created upon first access).
- Atomic checkout converting cart items into immutable order items.
- Strict ownership verification on order retrieval.

### 💳 Payments & Stripe Webhooks
- Seamless Stripe PaymentIntent creation with amount safety locks.
- Idempotent webhook listener with HMAC signature verification.
- Transactional state transitions from `PENDING` to `CONFIRMED` or `CANCELLED`.

### 📧 Email Notifications
- Responsive HTML transactional emails for account verification and password resets.
- SMTP integration with Nodemailer supporting Gmail, SendGrid, Brevo, or custom relays.

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Node.js 24 (LTS) | High-performance JavaScript server runtime |
| **Framework** | [NestJS 12](https://nestjs.com) | Enterprise modular architecture & DI engine |
| **Language** | TypeScript 6 | Strict type-safety across all modules |
| **Database** | PostgreSQL 16 (on [Neon](https://neon.tech)) | Serverless relational database with ACID transactions |
| **ORM** | [Prisma 7](https://www.prisma.io) | Type-safe queries & automated schema migrations |
| **Payments** | [Stripe](https://stripe.com) | PaymentIntent API & signed webhooks |
| **Validation** | Zod + class-validator | Fail-fast env checks & request payload validation |
| **Testing** | Jest + Supertest | Unit, Integration, and Concurrency E2E testing |
| **DevOps** | Docker + Docker Compose | Multi-stage slim container & local developer stack |
| **CI/CD** | GitHub Actions | Automated lint, test, build, and container checks |
| **Tooling** | oxlint + Prettier | Ultra-fast Rust-based linting and formatting |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 24.9
- **npm** >= 10
- **Docker** & **Docker Compose**

### Option 1: Quick Start with Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/mohamedelbeek55/ecommerce-api-nestjs.git
cd ecommerce-api-nestjs

# 2. Configure environment
cp .env.example .env
# Fill in required secrets (see Environment Variables section)

# 3. Spin up PostgreSQL + the API container
docker compose up -d

# 4. Access Swagger documentation
open http://localhost:3000/api/docs
```

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env

# 3. Start local Postgres via Docker
docker compose up -d postgres

# 4. Run migrations and generate Prisma Client
npx prisma migrate dev
npx prisma generate

# 5. Start dev server in watch mode
npm run start:dev

# 6. Open Swagger UI
# http://localhost:3000/api/docs
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and provide your secrets:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment (`development` / `production` / `test`) | `development` |
| `PORT` | API server listening port | `3000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_ACCESS_SECRET` | Secret key for access tokens (32+ chars) | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens (32+ chars) | `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | SMTP application password | `your-app-password` |
| `EMAIL_FROM` | Sender email address | `noreply@yourdomain.com` |
| `FRONTEND_URL` | Base URL used for generated email action links | `https://ecommerce-frontend-nqbt.vercel.app` (or `http://localhost:4200`) |

---

## 📡 API Endpoints Overview

All routes are served under `/api/v1`.

| Module | Method & Route | Description | Auth Required |
|--------|----------------|-------------|---------------|
| **Auth** | `POST /auth/register` | Register new customer account | No (Rate-limited) |
| | `POST /auth/login` | Login and receive access + refresh tokens | No (Rate-limited) |
| | `POST /auth/refresh` | Rotate access token with refresh token | No (Rate-limited) |
| | `POST /auth/logout` | Revoke active refresh session | Yes |
| | `POST /auth/verify-email` | Validate email token | No |
| | `POST /auth/forgot-password` | Request password reset email | No (Anti-enumeration) |
| | `POST /auth/reset-password` | Reset password using valid token | No |
| **Users** | `GET /users/me` | Retrieve authenticated profile | Yes |
| | `PATCH /users/me` | Update personal profile details | Yes |
| **Products** | `GET /products` | Search, filter, paginate catalog | No |
| | `GET /products/:id` | Get single product by ID | No |
| | `POST /products` | Create product with images & initial stock | **Admin Only** |
| | `PATCH /products/:id` | Update product details or stock | **Admin Only** |
| | `DELETE /products/:id` | Remove product from catalog | **Admin Only** |
| **Categories**| `GET /categories` | List all categories | No |
| | `POST /categories` | Create new category | **Admin Only** |
| **Cart** | `GET /cart` | Get current user's active cart | Yes |
| | `POST /cart/items` | Add or increment product in cart | Yes |
| | `PATCH /cart/items/:productId` | Set exact quantity in cart | Yes |
| | `DELETE /cart/items/:productId` | Remove product from cart | Yes |
| | `DELETE /cart` | Clear entire cart | Yes |
| **Orders** | `POST /orders/checkout` | Concurrency-safe atomic checkout | Yes |
| | `GET /orders` | View user order history | Yes |
| | `GET /orders/:id` | View specific order details | Yes (Owner only) |
| **Payments** | `POST /payments/orders/:orderId/intent` | Create Stripe PaymentIntent | Yes (Owner only) |
| | `POST /payments/webhook` | Ingest and verify Stripe webhooks | Stripe Signature |
| **Health** | `GET /health` | API & database connectivity check | No |

---

## 🧪 Testing & Concurrency Verification

```bash
# Run unit tests (Domain & Service logic in isolation)
npm test

# Run End-to-End tests against real PostgreSQL database
npm run test:e2e

# Run test coverage report
npm run test:cov
```

### Test Coverage Strategy
- **Unit Tests:** Business logic, discount calculations, edge cases, and error states using mocked repositories.
- **E2E Tests:** HTTP status codes, DTO validation pipes, JWT authentication, and database constraints.
- **Concurrency Tests:** Race conditions during checkout and PaymentIntent creation under parallel load.

---

## 🚢 Deployment

The API is fully containerized and deployed in production:

| Component | Platform | Configuration |
|-----------|----------|---------------|
| **Backend API** | [Hostless](https://ecommerce-api.hostless.app/api/docs) | Containerized Node 24 slim on Hostless (`https://ecommerce-api.hostless.app/api/v1`) |
| **Database** | [Neon](https://neon.tech) | Managed serverless PostgreSQL with connection pooling |
| **CI / CD** | GitHub Actions | Automatic migration deployment (`prisma migrate deploy`) on push to `main` |
| **Frontend** | [Vercel](https://ecommerce-frontend-nqbt.vercel.app/) | Angular 21 (Signals) + Tailwind CSS ([Live Demo](https://ecommerce-frontend-nqbt.vercel.app/)) |

---

## 📂 Project Structure

```text
.
├── .github/workflows/          # Automated GitHub Actions CI pipeline
├── docs/images/                # Screenshots, architecture diagrams, and previews
├── prisma/
│   ├── schema.prisma           # PostgreSQL schema models & relationships
│   └── migrations/             # Applied SQL migration history
├── src/
│   ├── auth/                   # JWT strategies, guards, RBAC, password reset
│   ├── cart/                   # User carts & decimal subtotal calculations
│   ├── categories/             # Catalog categories management
│   ├── config/                 # Fail-fast Zod environment validation
│   ├── database/               # PrismaService & pg connection adapter
│   ├── email/                  # Nodemailer provider & responsive templates
│   ├── health/                 # Database liveness checks
│   ├── orders/                 # Concurrency-safe checkout & transactions
│   │   ├── domain/             # Order entities & repository interface contracts
│   │   └── infrastructure/     # PrismaOrderRepository implementation
│   ├── payments/               # Stripe client, idempotency locks, signed webhooks
│   ├── products/               # Searchable catalog & inventory tracking
│   ├── users/                  # User self-service profiles
│   ├── app.module.ts           # Root module & global pipeline guards
│   └── main.ts                 # Helmet, global validation, Swagger bootstrap
├── test/
│   ├── checkout-concurrency.e2e-spec.ts  # Race condition verification suite
│   ├── auth.e2e-spec.ts        # Authentication flows E2E
│   ├── orders.e2e-spec.ts      # Checkout & history E2E
│   └── payments.e2e-spec.ts    # Webhook signature & idempotency E2E
├── Dockerfile                  # Multi-stage production build (non-root node)
├── docker-compose.yml          # Local Postgres + API orchestration
└── package.json
```

---

## 👤 Author

**Mohamed Elbeek**
- **GitHub:** [@mohamedelbeek55](https://github.com/mohamedelbeek55)
- **LinkedIn:** [Mohamed Elbeek](https://www.linkedin.com/in/mohamed-elbeek-9b81a230b/)
- **Email:** mohamed.elbeek88@gmail.com

---

⭐ **If you find this project informative or useful, please consider giving it a star on GitHub!**
