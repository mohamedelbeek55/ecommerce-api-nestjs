# =============================================
# Stage 1: Build
# =============================================
FROM node:24.9-bookworm-slim AS build

WORKDIR /app

# OpenSSL is required by Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies (including dev) for building
COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy source and build
COPY . .
RUN npm run generate && npm run build

# =============================================
# Stage 2: Runtime
# =============================================
FROM node:24.9-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# OpenSSL is required by Prisma at runtime too
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts

# Install Prisma CLI (needed for `prisma migrate deploy` at startup)
RUN npm install --no-save --legacy-peer-deps prisma@7.10.0 --ignore-scripts

# Copy built artifacts + Prisma schema/migrations
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# Generate Prisma client for the production environment
RUN npx prisma generate

# Run as non-root user (the `node` user ships with the official image)
USER node

EXPOSE 3000

# Run migrations, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]