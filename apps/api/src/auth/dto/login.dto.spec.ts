import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

function build(plain: object): LoginDto {
  return plainToInstance(LoginDto, plain);
}

describe('LoginDto', () => {
  describe('email', () => {
    it('accepts a valid email', async () => {
      const dto = build({ email: 'user@example.com', password: 'password123' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a non-email string', async () => {
      const dto = build({ email: 'not-an-email', password: 'password123' });
      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('rejects a missing email', async () => {
      const dto = build({ password: 'password123' });
      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors).toHaveLength(1);
    });

  });

  describe('password', () => {
    it('accepts a password of exactly 8 characters', async () => {
      const dto = build({ email: 'user@example.com', password: '12345678' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts a password longer than 8 characters', async () => {
      const dto = build({ email: 'user@example.com', password: 'supersecret' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a password shorter than 8 characters', async () => {
      const dto = build({ email: 'user@example.com', password: 'short' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('minLength');
    });

    it('rejects a non-string password', async () => {
      const dto = build({ email: 'user@example.com', password: 12345678 });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('isString');
    });

    it('rejects a missing password', async () => {
      const dto = build({ email: 'user@example.com' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
    });

  });
});
