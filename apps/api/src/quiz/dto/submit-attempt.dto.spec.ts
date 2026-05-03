import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SubmitAttemptDto } from './submit-attempt.dto';

function build(plain: object): SubmitAttemptDto {
  return plainToInstance(SubmitAttemptDto, plain);
}

describe('SubmitAttemptDto', () => {
  describe('answers', () => {
    it('accepts a valid array of non-negative integers', async () => {
      const dto = build({ answers: [0, 1, 2] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts an array with a single answer', async () => {
      const dto = build({ answers: [0] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts 0 as a valid answer index', async () => {
      const dto = build({ answers: [0] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a missing answers field', async () => {
      const dto = build({});
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answers')).toBe(true);
    });

    it('rejects an empty array', async () => {
      const dto = build({ answers: [] });
      const errors = await validate(dto);
      const answersErrors = errors.filter((e) => e.property === 'answers');
      expect(answersErrors.length).toBeGreaterThan(0);
      expect(answersErrors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('rejects answers containing negative values', async () => {
      const dto = build({ answers: [0, -1] });
      const errors = await validate(dto);
      const answersErrors = errors.filter((e) => e.property === 'answers');
      expect(answersErrors.length).toBeGreaterThan(0);
      expect(answersErrors[0].constraints).toHaveProperty('min');
    });

    it('rejects answers containing non-integer values', async () => {
      const dto = build({ answers: [0, 1.5] });
      const errors = await validate(dto);
      const answersErrors = errors.filter((e) => e.property === 'answers');
      expect(answersErrors.length).toBeGreaterThan(0);
      expect(answersErrors[0].constraints).toHaveProperty('isInt');
    });

    it('rejects a non-array answers value', async () => {
      const dto = build({ answers: 1 });
      const errors = await validate(dto);
      const answersErrors = errors.filter((e) => e.property === 'answers');
      expect(answersErrors.length).toBeGreaterThan(0);
    });
  });
});
