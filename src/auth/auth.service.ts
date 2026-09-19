import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Env } from '../config/env.validation';
import type { UserEntity } from '../users/domain/user.entity';
import { IUserRepository } from '../users/domain/user.repository.interface';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { AuthTokensDto } from './dto/auth-response.dto';
import { EmailService } from '../email/email.service';
import { hashToken, compareTokenWithHash } from './utils/hash-token.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly emailService: EmailService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.userRepository.create({
      email: dto.email,
      password: await bcrypt.hash(dto.password, 12), // ✅ bcrypt for passwords
      name: dto.name,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
      );
    } catch (error) {
      // Don't fail registration if the email provider is down
      this.logger.error('Failed to send verification email', error);
    }

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    const validPassword = user
      ? await bcrypt.compare(dto.password, user.password) // ✅ bcrypt for passwords
      : false;

    if (!user || !validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before logging in. ' +
        'Check your inbox for the verification link, or request a new one.',
      );
    }

    return this.issueTokens(user);
  }

  async refresh(
    userId: string,
    providedRefreshToken: string,
  ): Promise<AuthTokensDto> {
    const user = await this.userRepository.findById(userId);

    // ✅ SHA-256 comparison (no truncation, constant-time)
    if (
      !user?.hashedRefreshToken ||
      !compareTokenWithHash(providedRefreshToken, user.hashedRefreshToken)
    ) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.updateRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: UserEntity): Promise<AuthTokensDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
      },
    );

    // ✅ SHA-256 for refresh tokens (bcrypt truncates at 72 bytes)
    await this.userRepository.updateRefreshTokenHash(
      user.id,
      hashToken(refreshToken),
    );

    return { accessToken, refreshToken };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.emailVerificationTokenExpiresAt &&
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.userRepository.updateUserVerificationStatus(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    // Always return silently to prevent user enumeration
    if (!user) {
      return;
    }

    if (user.isEmailVerified) {
      return;
    }

    const newToken = randomBytes(32).toString('hex');
    const newTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepository.updateUserVerificationStatus(user.id, {
      emailVerificationToken: newToken,
      emailVerificationTokenExpiresAt: newTokenExpiresAt,
    });

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        newToken,
      );
    } catch (error) {
      this.logger.error('Failed to resend verification email', error);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    // Always return silently to prevent user enumeration
    if (!user) {
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.updatePasswordReset(user.id, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiresAt: tokenExpiresAt,
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
      );
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      user.passwordResetTokenExpiresAt &&
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12); // ✅ bcrypt for passwords
    await this.userRepository.updatePassword(user.id, hashedPassword);
  }
}