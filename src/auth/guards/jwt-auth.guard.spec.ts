import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: JwtAuthGuard;
  let context: ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    context = {
      getHandler: jest.fn().mockReturnValue('handler'),
      getClass: jest.fn().mockReturnValue('controller'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows public routes without calling the parent AuthGuard', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    // Spy on the inherited method directly so the public-route branch can be
    // verified without invoking Passport or creating a real HTTP request.
    const parentCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate',
    );

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      'handler',
      'controller',
    ]);
    expect(parentCanActivate).not.toHaveBeenCalled();
  });

  it('delegates to the parent AuthGuard when the route is not public', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const parentCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(parentCanActivate).toHaveBeenCalledWith(context);
  });

  it('propagates a false result from the parent AuthGuard', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(false);
  });
});
