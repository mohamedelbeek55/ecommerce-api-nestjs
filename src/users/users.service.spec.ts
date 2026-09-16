import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { UserEntity } from './domain/user.entity';
import { IUserRepository } from './domain/user.repository.interface';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateRefreshTokenHash: jest.Mock;
  };

  const user: UserEntity = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashed-password',
    name: 'Test User',
    role: Role.CUSTOMER,
    hashedRefreshToken: 'hashed-refresh-token',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(user),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(user),
      updateRefreshTokenHash: jest.fn(),
    };
    service = new UsersService(
      userRepository as unknown as IUserRepository,
    );
  });

  describe('findById', () => {
    it('returns a mapped profile without password or refresh-token hash', async () => {
      const profile = await service.findById(user.id);

      expect(profile).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect(profile).not.toHaveProperty('password');
      expect(profile).not.toHaveProperty('hashedRefreshToken');
      expect(userRepository.findById).toHaveBeenCalledWith(user.id);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findById(user.id)).rejects.toEqual(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('update', () => {
    it('updates and returns a mapped profile', async () => {
      const dto = { name: 'Updated User' };
      const updatedUser = { ...user, name: dto.name };
      userRepository.update.mockResolvedValue(updatedUser);

      await expect(service.update(user.id, dto)).resolves.toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
      expect(userRepository.findById).toHaveBeenCalledWith(user.id);
      expect(userRepository.update).toHaveBeenCalledWith(user.id, dto);
    });

    it('throws NotFoundException and does not update a missing user', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(user.id, { name: 'Updated User' }),
      ).rejects.toEqual(new NotFoundException('User not found'));
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});
