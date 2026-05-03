import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

function build(plain: object): CreateQuestionDto {
  return plainToInstance(CreateQuestionDto, plain);
}

const validQuestion = {
  question: 'What is the capital of France?',
  options: ['Berlin', 'Paris', 'Rome'],
  correctAnswer: 1,
  order: 1,
};

describe('CreateQuestionDto', () => {
  it('accepts a valid question object', async () => {
    const dto = build(validQuestion);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('question', () => {
    it('rejects a missing question', async () => {
      const dto = build({ ...validQuestion, question: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'question')).toBe(true);
    });

    it('rejects an empty string question', async () => {
      const dto = build({ ...validQuestion, question: '' });
      const errors = await validate(dto);
      const q = errors.filter((e) => e.property === 'question');
      expect(q.length).toBeGreaterThan(0);
      expect(q[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('rejects a non-string question', async () => {
      const dto = build({ ...validQuestion, question: 99 });
      const errors = await validate(dto);
      const q = errors.filter((e) => e.property === 'question');
      expect(q.length).toBeGreaterThan(0);
      expect(q[0].constraints).toHaveProperty('isString');
    });
  });

  describe('options', () => {
    it('rejects a missing options array', async () => {
      const dto = build({ ...validQuestion, options: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'options')).toBe(true);
    });

    it('rejects options with fewer than 2 items', async () => {
      const dto = build({ ...validQuestion, options: ['OnlyOne'] });
      const errors = await validate(dto);
      const opt = errors.filter((e) => e.property === 'options');
      expect(opt.length).toBeGreaterThan(0);
      expect(opt[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('rejects options containing non-strings', async () => {
      const dto = build({ ...validQuestion, options: ['A', 42] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'options')).toBe(true);
    });

    it('accepts exactly 2 options', async () => {
      const dto = build({ ...validQuestion, options: ['True', 'False'] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('correctAnswer', () => {
    it('accepts 0 as a valid index', async () => {
      const dto = build({ ...validQuestion, correctAnswer: 0 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a negative correctAnswer', async () => {
      const dto = build({ ...validQuestion, correctAnswer: -1 });
      const errors = await validate(dto);
      const ca = errors.filter((e) => e.property === 'correctAnswer');
      expect(ca.length).toBeGreaterThan(0);
      expect(ca[0].constraints).toHaveProperty('min');
    });

    it('rejects a non-integer correctAnswer', async () => {
      const dto = build({ ...validQuestion, correctAnswer: 1.5 });
      const errors = await validate(dto);
      const ca = errors.filter((e) => e.property === 'correctAnswer');
      expect(ca.length).toBeGreaterThan(0);
      expect(ca[0].constraints).toHaveProperty('isInt');
    });

    it('rejects a missing correctAnswer', async () => {
      const dto = build({ ...validQuestion, correctAnswer: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'correctAnswer')).toBe(true);
    });
  });

  describe('order', () => {
    it('rejects order less than 1', async () => {
      const dto = build({ ...validQuestion, order: 0 });
      const errors = await validate(dto);
      const ord = errors.filter((e) => e.property === 'order');
      expect(ord.length).toBeGreaterThan(0);
      expect(ord[0].constraints).toHaveProperty('min');
    });

    it('rejects a non-integer order', async () => {
      const dto = build({ ...validQuestion, order: 1.5 });
      const errors = await validate(dto);
      const ord = errors.filter((e) => e.property === 'order');
      expect(ord.length).toBeGreaterThan(0);
      expect(ord[0].constraints).toHaveProperty('isInt');
    });

    it('rejects a missing order', async () => {
      const dto = build({ ...validQuestion, order: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'order')).toBe(true);
    });
  });
});
