import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserEntity } from './domain/user.entity';
import { IUserRepository } from './domain/user.repository.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: UserEntity['role'];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(id: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async update(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    await this.ensureUserExists(id);
    const user = await this.userRepository.update(id, dto);
    return this.toResponse(user);
  }

  private async ensureUserExists(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private toResponse(user: UserEntity): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
