import type { CreateUserDto, UserEntity } from './user.entity';

export abstract class IUserRepository {
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract create(data: CreateUserDto): Promise<UserEntity>;
  abstract update(id: string, data: { name?: string }): Promise<UserEntity>;
  abstract updateRefreshTokenHash(id: string, hash: string | null): Promise<void>;
  abstract findByVerificationToken(token: string): Promise<UserEntity | null>;
  abstract updateUserVerificationStatus(
    userId: string,
    data: {
      isEmailVerified?: boolean;
      emailVerificationToken?: string | null;
      emailVerificationTokenExpiresAt?: Date | null;
    },
  ): Promise<void>;

  abstract findByPasswordResetToken(token: string): Promise<UserEntity | null>;
  abstract updatePasswordReset(
    userId: string,
    data: {
      passwordResetToken: string | null;
      passwordResetTokenExpiresAt: Date | null;
    },
  ): Promise<void>;
  abstract updatePassword(userId: string, hashedPassword: string): Promise<void>;
}
