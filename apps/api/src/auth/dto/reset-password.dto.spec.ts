import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ResetPasswordDto } from './reset-password.dto';

function build(plain: object): ResetPasswordDto {
  return plainToInstance(ResetPasswordDto, plain);
}

describe('ResetPasswordDto', () => {
  describe('email', () => {
    it('accepts a valid email', async () => {
      const dto = build({ email: 'user@example.com' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts emails with subdomains', async () => {
      const dto = build({ email: 'user@mail.example.co.uk' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects an invalid email format', async () => {
      const dto = build({ email: 'not-an-email' });
      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('rejects an email missing the domain part', async () => {
      const dto = build({ email: 'user@' });
      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('rejects a missing email field', async () => {
      const dto = build({});
      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors).toHaveLength(1);
    });

  });
});
