import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Role } from '@prisma/client';
import { SignupDto } from './signup.dto';

function build(plain: object): SignupDto {
  return plainToInstance(SignupDto, plain);
}

const VALID_BASE = { email: 'user@example.com', password: 'Password1!' };

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
    it('accepts a password of exactly 8 characters with required complexity', async () => {
      const dto = build({ ...VALID_BASE, password: 'Pass1!ab' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a password shorter than 8 characters', async () => {
      const dto = build({ ...VALID_BASE, password: 'P1!a' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('minLength');
    });

    it('rejects a password without uppercase letter', async () => {
      const dto = build({ ...VALID_BASE, password: 'password1!' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('matches');
    });

    it('rejects a password without lowercase letter', async () => {
      const dto = build({ ...VALID_BASE, password: 'PASSWORD1!' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('matches');
    });

    it('rejects a password without a digit', async () => {
      const dto = build({ ...VALID_BASE, password: 'Password!' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('matches');
    });

    it('rejects a password without a special character', async () => {
      const dto = build({ ...VALID_BASE, password: 'Password1' });
      const errors = await validate(dto);
      const pwErrors = errors.filter((e) => e.property === 'password');
      expect(pwErrors).toHaveLength(1);
      expect(pwErrors[0].constraints).toHaveProperty('matches');
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

    it('accepts APPRENANT and FORMATEUR roles', async () => {
      for (const role of [Role.APPRENANT, Role.FORMATEUR]) {
        const dto = build({ ...VALID_BASE, role });
        const errors = await validate(dto);
        const roleErrors = errors.filter((e) => e.property === 'role');
        expect(roleErrors).toHaveLength(0);
      }
    });

    it('rejects ADMIN role (cannot self-assign during signup)', async () => {
      const dto = build({ ...VALID_BASE, role: Role.ADMIN });
      const errors = await validate(dto);
      const roleErrors = errors.filter((e) => e.property === 'role');
      expect(roleErrors).toHaveLength(1);
      expect(roleErrors[0].constraints).toHaveProperty('isIn');
    });

    it('rejects an invalid role string', async () => {
      const dto = build({ ...VALID_BASE, role: 'SUPERADMIN' });
      const errors = await validate(dto);
      const roleErrors = errors.filter((e) => e.property === 'role');
      expect(roleErrors).toHaveLength(1);
      expect(roleErrors[0].constraints).toHaveProperty('isIn');
    });

    it('passes validation when role is omitted', async () => {
      const dto = build(VALID_BASE);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
