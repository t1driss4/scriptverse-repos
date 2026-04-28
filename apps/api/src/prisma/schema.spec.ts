import { Role, Level, LessonType } from '@prisma/client';

describe('Prisma schema enums', () => {
  describe('Role', () => {
    it('has exactly 3 values', () => {
      expect(Object.keys(Role)).toHaveLength(3);
    });

    it('contains APPRENANT', () => {
      expect(Role.APPRENANT).toBe('APPRENANT');
    });

    it('contains FORMATEUR', () => {
      expect(Role.FORMATEUR).toBe('FORMATEUR');
    });

    it('contains ADMIN', () => {
      expect(Role.ADMIN).toBe('ADMIN');
    });
  });

  describe('Level', () => {
    it('has exactly 3 values', () => {
      expect(Object.keys(Level)).toHaveLength(3);
    });

    it('contains DEBUTANT', () => {
      expect(Level.DEBUTANT).toBe('DEBUTANT');
    });

    it('contains INTERMEDIAIRE', () => {
      expect(Level.INTERMEDIAIRE).toBe('INTERMEDIAIRE');
    });

    it('contains AVANCE', () => {
      expect(Level.AVANCE).toBe('AVANCE');
    });
  });

  describe('LessonType', () => {
    it('has exactly 1 value', () => {
      expect(Object.keys(LessonType)).toHaveLength(1);
    });

    it('contains VIDEO', () => {
      expect(LessonType.VIDEO).toBe('VIDEO');
    });
  });
});
