import { PrismaClient, Role, Level, LessonType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  // ── Admin user ────────────────────────────────────────────────────────────
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('SEED_ADMIN_PASSWORD is required');
  const adminHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@scriptverse.dev' },
    update: {},
    create: {
      email: 'admin@scriptverse.dev',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'ScriptVerse',
      role: Role.ADMIN,
    },
  });

  // ── Demo formateur ────────────────────────────────────────────────────────
  const formateurPassword = process.env.SEED_FORMATEUR_PASSWORD;
  if (!formateurPassword) throw new Error('SEED_FORMATEUR_PASSWORD is required');
  const formateurHash = await bcrypt.hash(formateurPassword, SALT_ROUNDS);

  const formateur = await prisma.user.upsert({
    where: { email: 'formateur@scriptverse.dev' },
    update: {},
    create: {
      email: 'formateur@scriptverse.dev',
      passwordHash: formateurHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: Role.FORMATEUR,
    },
  });

  // ── Demo apprenant ────────────────────────────────────────────────────────
  const apprenantPassword = process.env.SEED_APPRENANT_PASSWORD;
  if (!apprenantPassword) throw new Error('SEED_APPRENANT_PASSWORD is required');
  const apprenantHash = await bcrypt.hash(apprenantPassword, SALT_ROUNDS);

  const apprenant = await prisma.user.upsert({
    where: { email: 'apprenant@scriptverse.dev' },
    update: {},
    create: {
      email: 'apprenant@scriptverse.dev',
      passwordHash: apprenantHash,
      firstName: 'Marie',
      lastName: 'Martin',
      role: Role.APPRENANT,
    },
  });

  // ── Demo course ───────────────────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      title: 'Introduction à TypeScript',
      description:
        'Apprenez les bases de TypeScript : types, interfaces, classes et modules. ' +
        'Ce cours vous guidera pas à pas de zéro jusqu\'aux fonctionnalités avancées.',
      level: Level.DEBUTANT,
      category: 'Programmation',
      price: 0,
      published: true,
      formateurId: formateur.id,
    },
  });

  // ── Module 1 ──────────────────────────────────────────────────────────────
  const module1 = await prisma.module.upsert({
    where: { id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' },
    update: {},
    create: {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      title: 'Les fondamentaux',
      order: 1,
      courseId: course.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' },
    update: {},
    create: {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      title: 'Pourquoi TypeScript ?',
      type: LessonType.VIDEO,
      url: 'https://example.com/videos/ts-intro',
      order: 1,
      moduleId: module1.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' },
    update: {},
    create: {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
      title: 'Types primitifs et inférence',
      type: LessonType.VIDEO,
      url: 'https://example.com/videos/ts-types',
      order: 2,
      moduleId: module1.id,
    },
  });

  const quiz1 = await prisma.quiz.upsert({
    where: { moduleId: module1.id },
    update: {},
    create: {
      title: 'Quiz — Les fondamentaux',
      moduleId: module1.id,
    },
  });

  await prisma.quizQuestion.upsert({
    where: { id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' },
    update: {},
    create: {
      id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
      question: 'Quelle annotation TypeScript déclare un nombre entier ?',
      options: ['string', 'number', 'int', 'float'],
      correctAnswer: 1,
      order: 1,
      quizId: quiz1.id,
    },
  });

  await prisma.quizQuestion.upsert({
    where: { id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2' },
    update: {},
    create: {
      id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
      question: 'TypeScript est un sur-ensemble strict de quel langage ?',
      options: ['Python', 'Java', 'JavaScript', 'C#'],
      correctAnswer: 2,
      order: 2,
      quizId: quiz1.id,
    },
  });

  // ── Module 2 ──────────────────────────────────────────────────────────────
  const module2 = await prisma.module.upsert({
    where: { id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8091a2b3' },
    update: {},
    create: {
      id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8091a2b3',
      title: 'Interfaces et classes',
      order: 2,
      courseId: course.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8091a2b3c4' },
    update: {},
    create: {
      id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8091a2b3c4',
      title: 'Déclarer une interface',
      type: LessonType.VIDEO,
      url: 'https://example.com/videos/ts-interfaces',
      order: 1,
      moduleId: module2.id,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'c9d0e1f2-a3b4-4c5d-6e7f-8091a2b3c4d5' },
    update: {},
    create: {
      id: 'c9d0e1f2-a3b4-4c5d-6e7f-8091a2b3c4d5',
      title: 'Classes et héritage',
      type: LessonType.VIDEO,
      url: 'https://example.com/videos/ts-classes',
      order: 2,
      moduleId: module2.id,
    },
  });

  // ── Demo enrollment ───────────────────────────────────────────────────────
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: apprenant.id, courseId: course.id } },
    update: {},
    create: {
      userId: apprenant.id,
      courseId: course.id,
    },
  });

  console.log('Seed completed:');
  console.log(`  admin      → ${admin.email}`);
  console.log(`  formateur  → ${formateur.email}`);
  console.log(`  apprenant  → ${apprenant.email}`);
  console.log(`  course     → "${course.title}" (published)`);
  console.log(`  modules    → ${module1.title}, ${module2.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
