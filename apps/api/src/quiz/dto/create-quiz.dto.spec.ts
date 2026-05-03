import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateQuizDto } from './create-quiz.dto';

function build(plain: object): CreateQuizDto {
  return plainToInstance(CreateQuizDto, plain);
}

describe('CreateQuizDto', () => {
  describe('title', () => {
    it('accepts a valid non-empty string title', async () => {
      const dto = build({ title: 'Introduction Quiz' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a missing title', async () => {
      const dto = build({});
      const errors = await validate(dto);
      const titleErrors = errors.filter((e) => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
    });

    it('rejects an empty string title', async () => {
      const dto = build({ title: '' });
      const errors = await validate(dto);
      const titleErrors = errors.filter((e) => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
      expect(titleErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('rejects a non-string title', async () => {
      const dto = build({ title: 42 });
      const errors = await validate(dto);
      const titleErrors = errors.filter((e) => e.property === 'title');
      expect(titleErrors.length).toBeGreaterThan(0);
      expect(titleErrors[0].constraints).toHaveProperty('isString');
    });
  });
});
