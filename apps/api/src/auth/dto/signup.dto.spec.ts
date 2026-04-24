import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Role } from '@prisma/client';
import { SignupDto } from './signup.dto';

function build(plain: object): SignupDto {
  return plainToInstance(SignupDto, plain);
}

const VALID_BASE = { email: 'user@example.com', password: 'password123' };

describe('SignupDto', () => {
  describe('email', () => {
    it('accepts a valid email', async () => {
      const dto = build(VALID_BASE);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects an invalid email format', async () => {
      const dto = build({ ...VALID_BASE, email: 'not-an-email' });
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
      const dto = build({ ...VALID_BASE, password: '12345678' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a password shorter than 8 characters', async () => {
      const dto = build({ ...VALID_BASE, password: 'short' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('minLength');
    });

    it('rejects a non-string password', async () => {
      const dto = build({ ...VALID_BASE, password: 99999999 });
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

  describe('role (optional)', () => {
    it('accepts a valid Role enum value', async () => {
      const dto = build({ ...VALID_BASE, role: Role.APPRENANT });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts all valid Role values', async () => {
      for (const role of Object.values(Role)) {
        const dto = build({ ...VALID_BASE, role });
        const errors = await validate(dto);
        const roleErrors = errors.filter((e) => e.property === 'role');
        expect(roleErrors).toHaveLength(0);
      }
    });

    it('rejects an invalid role string', async () => {
      const dto = build({ ...VALID_BASE, role: 'SUPERADMIN' });
      const errors = await validate(dto);
      const roleErrors = errors.filter((e) => e.property === 'role');
      expect(roleErrors).toHaveLength(1);
      expect(roleErrors[0].constraints).toHaveProperty('isEnum');
    });

    it('passes validation when role is omitted', async () => {
      const dto = build(VALID_BASE);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
