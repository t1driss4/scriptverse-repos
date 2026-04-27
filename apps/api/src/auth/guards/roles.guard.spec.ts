import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function mockContext(role: Role | undefined): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role !== undefined ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<
      Pick<Reflector, 'getAllAndOverride'>
    >;
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('grants access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(Role.APPRENANT))).toBe(true);
  });

  it('grants access when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.FORMATEUR]);
    expect(guard.canActivate(mockContext(Role.FORMATEUR))).toBe(true);
  });

  it('denies access when user does not have the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.FORMATEUR]);
    expect(guard.canActivate(mockContext(Role.APPRENANT))).toBe(false);
  });

  it('grants ADMIN access to ADMIN-only routes', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(mockContext(Role.ADMIN))).toBe(true);
  });

  it('denies non-ADMIN users from ADMIN-only routes', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(mockContext(Role.FORMATEUR))).toBe(false);
    expect(guard.canActivate(mockContext(Role.APPRENANT))).toBe(false);
  });

  it('grants access when user has one of multiple allowed roles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.FORMATEUR, Role.ADMIN]);
    expect(guard.canActivate(mockContext(Role.ADMIN))).toBe(true);
    expect(guard.canActivate(mockContext(Role.FORMATEUR))).toBe(true);
    expect(guard.canActivate(mockContext(Role.APPRENANT))).toBe(false);
  });

  it('denies access when user is undefined (unauthenticated)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.FORMATEUR]);
    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });
});
