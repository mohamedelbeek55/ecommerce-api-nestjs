import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Env } from '../config/env.validation';
import type { UserEntity } from '../users/domain/user.entity';
import { IUserRepository } from '../users/domain/user.repository.interface';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { AuthTokensDto } from './dto/auth-response.dto';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';



@Injectable()
export class AuthService {
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
      password: await bcrypt.hash(dto.password, 12),
      name: dto.name,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });
    try {
      await this.emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // ممكن هنا نضيف منطق إضافي، لكن مش هنعطل التسجيل
    }

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    const validPassword = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(userId: string, providedRefreshToken: string): Promise<AuthTokensDto> {
    const user = await this.userRepository.findById(userId);
    if (
      !user?.hashedRefreshToken ||
      !(await bcrypt.compare(providedRefreshToken, user.hashedRefreshToken))
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

    await this.userRepository.updateRefreshTokenHash(
      user.id,
      await bcrypt.hash(refreshToken, 12),
    );

    return { accessToken, refreshToken };
  }
  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.userRepository.updateUserVerificationStatus(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });
  }


  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    // ⚠️ نرجّع 204 دايماً، حتى لو الإيميل مش موجود (منع User Enumeration)
    if (!user) {
      return;
    }

    // ولّد توكن عشوائي + وقت انتهاء (15 دقيقة)
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
      console.error('Failed to send password reset email:', error);
      // مش هنعطّل الـ request
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

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updatePassword(user.id, hashedPassword);
  }
}
