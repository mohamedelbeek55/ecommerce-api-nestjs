import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { IUserRepository } from '../users/domain/user.repository.interface';
import type { UserEntity } from '../users/domain/user.entity';
import { EmailService } from '../email/email.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  jest.setTimeout(15000);

  let service: AuthService;
  let userRepository: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateRefreshTokenHash: jest.Mock;
    findByVerificationToken: jest.Mock;
    updateUserVerificationStatus: jest.Mock;
    findByPasswordResetToken: jest.Mock;
    updatePasswordReset: jest.Mock;
    updatePassword: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let emailService: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };

  // ✅ Base mock user — with ALL the new fields
  const user: UserEntity = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'stored-password-hash',
    name: 'Test User',
    role: Role.CUSTOMER,
    hashedRefreshToken: null,
    // 👇 New fields
    isEmailVerified: true, // ✅ Default to verified so login tests pass
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(user),
      update: jest.fn(),
      updateRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
      findByVerificationToken: jest.fn().mockResolvedValue(null),
      updateUserVerificationStatus: jest.fn().mockResolvedValue(undefined),
      findByPasswordResetToken: jest.fn().mockResolvedValue(null),
      updatePasswordReset: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return values[key];
      }),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: IUserRepository, useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EmailService, useValue: emailService }, // 👈 السطر الحيوي
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a user, sends verification email, and returns tokens', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'plain-password',
        name: 'New User',
      };

      const result = await service.register(dto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      // 👇 استخدم objectContaining لأن في حقول جديدة بقت بتتبعت
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          password: expect.any(String),
          name: dto.name,
          emailVerificationToken: expect.any(String),
          emailVerificationTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      // 👇 تأكد إن الإيميل اتبعت
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        user.email,
        user.name,
        expect.any(String),
      );
    });

    it('throws ConflictException when the email is already registered', async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(
        service.register({
          email: user.email,
          password: 'plain-password',
          name: user.name,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('passes a bcrypt hash instead of the plaintext password to the repository', async () => {
      const password = 'plain-password';

      await service.register({
        email: 'new@example.com',
        password,
        name: 'New User',
      });

      const [{ password: hashedPassword }] =
        userRepository.create.mock.calls[0];
      expect(hashedPassword).not.toBe(password);
      await expect(bcrypt.compare(password, hashedPassword)).resolves.toBe(true);
    });

    it('still succeeds when sending the verification email fails', async () => {
      emailService.sendVerificationEmail.mockRejectedValueOnce(
        new Error('SMTP down'),
      );

      await expect(
        service.register({
          email: 'new@example.com',
          password: 'plain-password',
          name: 'New User',
        }),
      ).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('login', () => {
    it('returns tokens when the password matches and the email is verified', async () => {
      const password = 'correct-password';
      userRepository.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash(password, 4),
        isEmailVerified: true,
      });

      await expect(
        service.login({ email: user.email, password }),
      ).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('throws ForbiddenException when the email is not verified', async () => {
      const password = 'correct-password';
      userRepository.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash(password, 4),
        isEmailVerified: false, // 👈 الحالة الجديدة
      });

      await expect(
        service.login({ email: user.email, password }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      await expect(
        service.login({
          email: 'missing@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash('correct-password', 4),
        isEmailVerified: true,
      });

      await expect(
        service.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));
    });

    it('uses the same error for missing users and wrong passwords', async () => {
      let missingUserError: UnauthorizedException | undefined;
      try {
        await service.login({
          email: 'missing@example.com',
          password: 'wrong-password',
        });
      } catch (error) {
        missingUserError = error as UnauthorizedException;
      }

      userRepository.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash('correct-password', 4),
        isEmailVerified: true,
      });
      let wrongPasswordError: UnauthorizedException | undefined;
      try {
        await service.login({
          email: user.email,
          password: 'wrong-password',
        });
      } catch (error) {
        wrongPasswordError = error as UnauthorizedException;
      }

      expect(missingUserError).toBeInstanceOf(UnauthorizedException);
      expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
      expect(missingUserError?.message).toBe('Invalid credentials');
      expect(wrongPasswordError?.message).toBe('Invalid credentials');
      expect(missingUserError!.getResponse()).toEqual(
        wrongPasswordError!.getResponse(),
      );
    });
  });

  describe('refresh', () => {
    it('returns new tokens when the refresh token matches its stored hash', async () => {
      const refreshToken = 'provided-refresh-token';
      userRepository.findById.mockResolvedValue({
        ...user,
        hashedRefreshToken: await bcrypt.hash(refreshToken, 4),
      });

      await expect(service.refresh(user.id, refreshToken)).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('throws UnauthorizedException when no refresh-token hash is stored', async () => {
      userRepository.findById.mockResolvedValue({
        ...user,
        hashedRefreshToken: null,
      });

      await expect(
        service.refresh(user.id, 'provided-refresh-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the refresh token does not match', async () => {
      userRepository.findById.mockResolvedValue({
        ...user,
        hashedRefreshToken: await bcrypt.hash('different-token', 4),
      });

      await expect(
        service.refresh(user.id, 'provided-refresh-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('clears the stored refresh-token hash', async () => {
      await service.logout(user.id);

      expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
        user.id,
        null,
      );
    });
  });

  describe('verifyEmail', () => {
    it('marks the user as verified and clears the token', async () => {
      const token = 'valid-token';
      userRepository.findByVerificationToken.mockResolvedValue({
        ...user,
        isEmailVerified: false,
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000),
      });

      await service.verifyEmail(token);

      expect(userRepository.updateUserVerificationStatus).toHaveBeenCalledWith(
        user.id,
        {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      );
    });

    it('throws BadRequestException for an invalid token', async () => {
      userRepository.findByVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        'Invalid verification token',
      );
    });

    it('throws BadRequestException for an expired token', async () => {
      userRepository.findByVerificationToken.mockResolvedValue({
        ...user,
        isEmailVerified: false,
        emailVerificationToken: 'expired-token',
        emailVerificationTokenExpiresAt: new Date(Date.now() - 60_000),
      });

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        'Verification token has expired',
      );
    });
  });

  describe('issueTokens', () => {
    it('signs both payloads with the configured secrets and expiries', async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash('password', 4),
        isEmailVerified: true,
      });
      await service.login({ email: user.email, password: 'password' });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: user.id, email: user.email, role: user.role },
        { secret: 'access-secret', expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: user.id },
        { secret: 'refresh-secret', expiresIn: '7d' },
      );
    });

    it('stores a bcrypt hash of the newly issued refresh token', async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash('password', 4),
        isEmailVerified: true,
      });

      await service.login({ email: user.email, password: 'password' });

      expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
      );
      const [, storedHash] =
        userRepository.updateRefreshTokenHash.mock.calls[0];
      expect(storedHash).not.toBe('refresh-token');
      await expect(bcrypt.compare('refresh-token', storedHash)).resolves.toBe(
        true,
      );
    });
  });
});