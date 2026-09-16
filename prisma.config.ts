import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma v7 CLI configuration.
 *
 * The datasource URL is read here by the CLI for migrations and generate.
 * At runtime, PrismaService passes the URL via the PrismaClient constructor
 * so NestJS's ConfigService (with Zod validation) remains the single source
 * of truth for env vars.
 *
 * process.env.DATABASE_URL falls back to '' rather than using the env()
 * helper so that `prisma generate` (which doesn't need a live DB) succeeds
 * even in CI environments where DATABASE_URL is not set.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
