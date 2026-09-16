import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() — PrismaService is needed across the entire app.
 * Marking the module global means other modules don't need to
 * import DatabaseModule explicitly; they just inject PrismaService.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule { }
