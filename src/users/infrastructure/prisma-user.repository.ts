import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateUserDto, UserEntity } from '../domain/user.entity';
import { IUserRepository } from '../domain/user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserDto): Promise<UserEntity> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: { name?: string }): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
    });
  }

  async updateRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken: hash },
    });
  }

  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  async updateUserVerificationStatus(
    userId: string,
    data: {
      isEmailVerified?: boolean;
      emailVerificationToken?: string | null;
      emailVerificationTokenExpiresAt?: Date | null;
    },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  // 👇 الطرق الجديدة لـ Forgot Password

  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });
  }

  async updatePasswordReset(
    userId: string,
    data: {
      passwordResetToken: string | null;
      passwordResetTokenExpiresAt: Date | null;
    },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        // لما نغير الباسورد، نعمل logout من كل الأجهزة
        hashedRefreshToken: null,
        // ونمسح التوكنات
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });
  }
}