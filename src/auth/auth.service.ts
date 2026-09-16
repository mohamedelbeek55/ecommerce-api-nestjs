import {
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.userRepository.create({
      email: dto.email,
      password: await bcrypt.hash(dto.password, 12),
      name: dto.name,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(dto.email);
    const validPassword = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(userId: string, providedRefreshToken: string): Promise<AuthTokens> {
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

  private async issueTokens(user: UserEntity): Promise<AuthTokens> {
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
}
