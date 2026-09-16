import { Role } from '@prisma/client';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  hashedRefreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}
