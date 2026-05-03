import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { GetUser } from './get-user.decorator';

function extractFactory(decorator: ParameterDecorator) {
  class TestController {
    handler(@decorator value: unknown) {}
  }
  const meta = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler');
  const key = Object.keys(meta)[0];
  return meta[key].factory as (data: string | undefined, ctx: ExecutionContext) => unknown;
}

function mockContext(user: Record<string, unknown> | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('@GetUser decorator', () => {
  const factory = extractFactory(GetUser() as ParameterDecorator);

  const MOCK_USER = {
    sub: 'user-uuid',
    email: 'user@example.com',
    role: Role.APPRENANT,
  };

  it('returns the full user object when no data key is provided', () => {
    const result = factory(undefined, mockContext(MOCK_USER));
    expect(result).toEqual(MOCK_USER);
  });

  it('returns a specific field when a field name is given', () => {
    const result = factory('email', mockContext(MOCK_USER));
    expect(result).toBe('user@example.com');
  });

  it('returns the role field when requested', () => {
    const result = factory('role', mockContext(MOCK_USER));
    expect(result).toBe(Role.APPRENANT);
  });

  it('returns the sub field when requested', () => {
    const result = factory('sub', mockContext(MOCK_USER));
    expect(result).toBe('user-uuid');
  });

  it('returns undefined when user is absent and no field is requested', () => {
    const result = factory(undefined, mockContext(undefined));
    expect(result).toBeUndefined();
  });

  it('returns undefined when user is absent and a field is requested', () => {
    const result = factory('email', mockContext(undefined));
    expect(result).toBeUndefined();
  });
});
