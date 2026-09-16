import { Module } from '@nestjs/common';
import { IUserRepository } from './domain/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    UsersService,
  ],
  exports: [IUserRepository, UsersService],
})
export class UsersModule {}
