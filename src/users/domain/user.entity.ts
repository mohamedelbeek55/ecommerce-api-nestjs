import { Role } from '@prisma/client';

export interface UserEntity {
  id: string;
  email: string;
  password: string | null;
  name: string;
  googleId: string | null;
  role: Role;
  hashedRefreshToken: string | null;

  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationTokenExpiresAt: Date | null;

  passwordResetToken: string | null;
  passwordResetTokenExpiresAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password?: string;
  name: string;
  googleId?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiresAt?: Date;
}