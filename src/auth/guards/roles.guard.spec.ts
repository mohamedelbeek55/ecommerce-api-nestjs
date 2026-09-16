import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;
  let request: { user?: { role?: Role } };
  let context: ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    request = {};
    context = {
      getHandler: jest.fn().mockReturnValue('handler'),
      getClass: jest.fn().mockReturnValue('controller'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it.each([undefined, []])(
    'allows the request when roles metadata is %p',
    (roles) => {
      reflector.getAllAndOverride.mockReturnValue(roles);

      expect(guard.canActivate(context)).toBe(true);
    },
  );

  it('allows the request when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    request.user = { role: Role.ADMIN };

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    request.user = { role: Role.CUSTOMER };

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when no authenticated user exists', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
