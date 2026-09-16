import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { Env } from '../config/env.validation';

/**
 * PrismaService extends PrismaClient so every Prisma model accessor
 * (this.user, this.product, …) is available directly on the service.
 *
 * In Prisma v7, the datasource URL is no longer read from schema.prisma at
 * runtime. We use the PrismaPg driver adapter pattern with a pg Pool
 * to manage connections. The connection string is sourced from NestJS's
 * ConfigService so it flows through Zod validation first.
 *
 * OnModuleInit    → $connect()    establishes the connection pool at startup.
 * OnModuleDestroy → $disconnect() drains the pool on graceful shutdown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    const connectionString = config.get('DATABASE_URL', { infer: true });
    const adapter = new PrismaPg(new Pool({ connectionString }));
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Lightweight connectivity check used by the health endpoint.
   * SELECT 1 is the cheapest possible round-trip to Postgres.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
