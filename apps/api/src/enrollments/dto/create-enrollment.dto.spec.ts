import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEnrollmentDto } from './create-enrollment.dto';

function build(plain: object): CreateEnrollmentDto {
  return plainToInstance(CreateEnrollmentDto, plain);
}

const VALID_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

describe('CreateEnrollmentDto', () => {
  describe('courseId', () => {
    it('accepts a valid UUID', async () => {
      const dto = build({ courseId: VALID_UUID });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects a non-UUID string', async () => {
      const dto = build({ courseId: 'not-a-uuid' });
      const errors = await validate(dto);
      const field = errors.filter((e) => e.property === 'courseId');
      expect(field).toHaveLength(1);
      expect(field[0].constraints).toHaveProperty('isUuid');
    });

    it('rejects an empty string', async () => {
      const dto = build({ courseId: '' });
      const errors = await validate(dto);
      const field = errors.filter((e) => e.property === 'courseId');
      expect(field).toHaveLength(1);
    });

    it('rejects a missing courseId', async () => {
      const dto = build({});
      const errors = await validate(dto);
      const field = errors.filter((e) => e.property === 'courseId');
      expect(field).toHaveLength(1);
    });

    it('rejects a numeric courseId', async () => {
      const dto = build({ courseId: 12345 });
      const errors = await validate(dto);
      const field = errors.filter((e) => e.property === 'courseId');
      expect(field).toHaveLength(1);
    });
  });
});
