import type { CreateUserDto, UserEntity } from './user.entity';

export abstract class IUserRepository {
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract create(data: CreateUserDto): Promise<UserEntity>;
  abstract update(id: string, data: { name?: string }): Promise<UserEntity>;
  abstract updateRefreshTokenHash(id: string, hash: string | null): Promise<void>;
}
