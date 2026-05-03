import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateQuestionDto } from './update-question.dto';

function build(plain: object): UpdateQuestionDto {
  return plainToInstance(UpdateQuestionDto, plain);
}

describe('UpdateQuestionDto', () => {
  it('accepts an empty object (all fields optional)', async () => {
    const dto = build({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('question', () => {
    it('accepts a valid non-empty question string', async () => {
      const dto = build({ question: 'Updated question?' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects an empty string question', async () => {
      const dto = build({ question: '' });
      const errors = await validate(dto);
      const q = errors.filter((e) => e.property === 'question');
      expect(q.length).toBeGreaterThan(0);
      expect(q[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('rejects a non-string question', async () => {
      const dto = build({ question: 42 });
      const errors = await validate(dto);
      const q = errors.filter((e) => e.property === 'question');
      expect(q.length).toBeGreaterThan(0);
      expect(q[0].constraints).toHaveProperty('isString');
    });
  });

  describe('options', () => {
    it('accepts a valid options array with at least 2 strings', async () => {
      const dto = build({ options: ['Yes', 'No'] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects options with fewer than 2 items', async () => {
      const dto = build({ options: ['Only'] });
      const errors = await validate(dto);
      const opt = errors.filter((e) => e.property === 'options');
      expect(opt.length).toBeGreaterThan(0);
      expect(opt[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('rejects options containing non-strings', async () => {
      const dto = build({ options: ['A', 2] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'options')).toBe(true);
    });
  });

  describe('correctAnswer', () => {
    it('accepts 0 as a valid index', async () => {
      const dto = build({ correctAnswer: 0 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a negative correctAnswer', async () => {
      const dto = build({ correctAnswer: -1 });
      const errors = await validate(dto);
      const ca = errors.filter((e) => e.property === 'correctAnswer');
      expect(ca.length).toBeGreaterThan(0);
      expect(ca[0].constraints).toHaveProperty('min');
    });

    it('rejects a non-integer correctAnswer', async () => {
      const dto = build({ correctAnswer: 0.5 });
      const errors = await validate(dto);
      const ca = errors.filter((e) => e.property === 'correctAnswer');
      expect(ca.length).toBeGreaterThan(0);
      expect(ca[0].constraints).toHaveProperty('isInt');
    });
  });

  describe('order', () => {
    it('accepts a valid order >= 1', async () => {
      const dto = build({ order: 3 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects order less than 1', async () => {
      const dto = build({ order: 0 });
      const errors = await validate(dto);
      const ord = errors.filter((e) => e.property === 'order');
      expect(ord.length).toBeGreaterThan(0);
      expect(ord[0].constraints).toHaveProperty('min');
    });

    it('rejects a non-integer order', async () => {
      const dto = build({ order: 1.5 });
      const errors = await validate(dto);
      const ord = errors.filter((e) => e.property === 'order');
      expect(ord.length).toBeGreaterThan(0);
      expect(ord[0].constraints).toHaveProperty('isInt');
    });
  });
});
