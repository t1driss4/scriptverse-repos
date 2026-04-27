import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAccessGuard } from './jwt-access.guard';

function makeContext(): ExecutionContext {
  const handler = jest.fn();
  const cls = jest.fn();
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('JwtAccessGuard', () => {
  let guard: JwtAccessGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
    guard = new JwtAccessGuard(reflector as unknown as Reflector);
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── @Public() short-circuit ───────────────────────────────────────────────

  it('returns true immediately when route is marked @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('reads the IS_PUBLIC_KEY from handler and class metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeContext();
    guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
  });

  it('does not invoke the passport JWT strategy for @Public() routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const superActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAccessGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    guard.canActivate(makeContext());
    expect(superActivate).not.toHaveBeenCalled();
  });

  // ─── Passport delegation ───────────────────────────────────────────────────

  it('delegates to the passport JWT strategy when route is not public', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const superActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAccessGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    const ctx = makeContext();

    const result = guard.canActivate(ctx);

    expect(superActivate).toHaveBeenCalledWith(ctx);
    expect(result).toBe(true);
  });

  it('delegates to the passport JWT strategy when no @Public() metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const superActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAccessGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    guard.canActivate(makeContext());

    expect(superActivate).toHaveBeenCalled();
  });

  it('forwards the result from the passport strategy', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jest
      .spyOn(Object.getPrototypeOf(JwtAccessGuard.prototype), 'canActivate')
      .mockReturnValue(false);

    expect(guard.canActivate(makeContext())).toBe(false);
  });
});
