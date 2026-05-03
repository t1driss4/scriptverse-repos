import type { Course, CourseModule, User, Enrollment, QuizAttempt } from './types';

export const mockFormateur: User = {
  id: 'f1',
  email: 'alice@scriptverse.dev',
  firstName: 'Alice',
  lastName: 'Martin',
  role: 'FORMATEUR',
};

export const mockUser: User = {
  id: 'u1',
  email: 'bob@example.com',
  firstName: 'Bob',
  lastName: 'Dupont',
  role: 'APPRENANT',
};

const modulesC1: CourseModule[] = [
  {
    id: 'm1',
    title: 'Fondamentaux',
    order: 1,
    courseId: 'c1',
    lessons: [
      { id: 'ch1', title: 'Introduction et environnement', type: 'VIDEO', order: 1, moduleId: 'm1', completed: true },
      { id: 'ch2', title: 'Async/Await en profondeur', type: 'VIDEO', order: 2, moduleId: 'm1', completed: true },
      { id: 'ch3', title: 'Modules ES et bundlers', type: 'VIDEO', order: 3, moduleId: 'm1', completed: false },
    ],
  },
  {
    id: 'm2',
    title: 'Avancé',
    order: 2,
    courseId: 'c1',
    lessons: [
      { id: 'ch4', title: 'Proxies et Reflect API', type: 'VIDEO', order: 1, moduleId: 'm2', completed: false },
      { id: 'ch5', title: 'Patterns avancés', type: 'VIDEO', order: 2, moduleId: 'm2', completed: false },
      { id: 'ch6', title: 'Projet final & évaluation', type: 'VIDEO', order: 3, moduleId: 'm2', completed: false },
    ],
  },
];

const modulesC2: CourseModule[] = [
  {
    id: 'm3',
    title: 'TypeScript & Hooks',
    order: 1,
    courseId: 'c2',
    lessons: [
      { id: 'ch7', title: 'TypeScript pour React', type: 'VIDEO', order: 1, moduleId: 'm3', completed: true },
      { id: 'ch8', title: 'Hooks avancés et personnalisés', type: 'VIDEO', order: 2, moduleId: 'm3', completed: false },
      { id: 'ch9', title: "Gestion d'état globale", type: 'VIDEO', order: 3, moduleId: 'm3', completed: false },
      { id: 'ch10', title: 'Tests avec Vitest & RTL', type: 'VIDEO', order: 4, moduleId: 'm3', completed: false },
    ],
  },
];

const modulesC3: CourseModule[] = [
  {
    id: 'm4',
    title: 'Python & NumPy',
    order: 1,
    courseId: 'c3',
    lessons: [
      { id: 'ch11', title: 'Python et environnements virtuels', type: 'VIDEO', order: 1, moduleId: 'm4', completed: false },
      { id: 'ch12', title: 'NumPy — calcul vectorisé', type: 'VIDEO', order: 2, moduleId: 'm4', completed: false },
    ],
  },
  {
    id: 'm5',
    title: 'Pandas & ML',
    order: 2,
    courseId: 'c3',
    lessons: [
      { id: 'ch13', title: 'Pandas — manipulation de données', type: 'VIDEO', order: 1, moduleId: 'm5', completed: false },
      { id: 'ch14', title: 'Visualisation avec Matplotlib', type: 'VIDEO', order: 2, moduleId: 'm5', completed: false },
      { id: 'ch15', title: 'Introduction au Machine Learning', type: 'VIDEO', order: 3, moduleId: 'm5', completed: false },
    ],
  },
];

const modulesC4: CourseModule[] = [
  {
    id: 'm6',
    title: 'Docker',
    order: 1,
    courseId: 'c4',
    lessons: [
      { id: 'ch16', title: 'Docker fundamentals', type: 'VIDEO', order: 1, moduleId: 'm6', completed: false },
      { id: 'ch17', title: 'Docker Compose et multi-services', type: 'VIDEO', order: 2, moduleId: 'm6', completed: false },
    ],
  },
  {
    id: 'm7',
    title: 'Kubernetes & CI/CD',
    order: 2,
    courseId: 'c4',
    lessons: [
      { id: 'ch18', title: 'Kubernetes basics', type: 'VIDEO', order: 1, moduleId: 'm7', completed: false },
      { id: 'ch19', title: 'CI/CD avec GitHub Actions', type: 'VIDEO', order: 2, moduleId: 'm7', completed: false },
    ],
  },
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'JavaScript Moderne — ES2024',
    description:
      'Maîtrisez les dernières fonctionnalités de JavaScript : async/await avancé, modules ES, Proxies, WeakRefs et bien plus encore. Ce cours vous donnera une maîtrise solide du langage pour des projets professionnels.',
    price: 49,
    level: 'INTERMEDIAIRE',
    category: 'Développement Web',
    published: true,
    formateurId: 'f1',
    formateur: mockFormateur,
    modules: modulesC1,
    _count: { modules: modulesC1.length, enrollments: 1240 },
  },
  {
    id: 'c2',
    title: 'React & TypeScript — Applications Robustes',
    description:
      "Construisez des applications React scalables avec TypeScript, hooks personnalisés, Context API, React Query et les meilleures pratiques de l'industrie pour des projets en équipe.",
    price: 59,
    level: 'AVANCE',
    category: 'Développement Web',
    published: true,
    formateurId: 'f1',
    formateur: mockFormateur,
    modules: modulesC2,
    _count: { modules: modulesC2.length, enrollments: 876 },
  },
  {
    id: 'c3',
    title: 'Python pour la Data Science',
    description:
      "Pandas, NumPy, Matplotlib et Scikit-learn — de l'analyse exploratoire au machine learning supervisé. Idéal pour les débutants en data science souhaitant progresser rapidement.",
    price: 69,
    level: 'DEBUTANT',
    category: 'Data Science',
    published: true,
    formateurId: 'f2',
    formateur: {
      id: 'f2',
      firstName: 'Thomas',
      lastName: 'Leblanc',
    } as Pick<User, 'id' | 'firstName' | 'lastName'>,
    modules: modulesC3,
    _count: { modules: modulesC3.length, enrollments: 2100 },
  },
  {
    id: 'c4',
    title: 'DevOps avec Docker & Kubernetes',
    description:
      "Conteneurisation, orchestration et CI/CD : déployez vos applications en production avec Docker, Docker Compose, Kubernetes et GitHub Actions. Cours orienté pratique avec projets réels.",
    price: 79,
    level: 'AVANCE',
    category: 'DevOps',
    published: false,
    formateurId: 'f1',
    formateur: mockFormateur,
    modules: modulesC4,
    _count: { modules: modulesC4.length, enrollments: 0 },
  },
];

export const mockEnrollments: Enrollment[] = [
  {
    courseId: 'c1',
    course: mockCourses[0],
    progress: 33,
    completedModules: ['ch1', 'ch2'],
  },
  {
    courseId: 'c2',
    course: mockCourses[1],
    progress: 25,
    completedModules: ['ch7'],
  },
];

export const mockQuizAttempts: QuizAttempt[] = [
  {
    quizId: 'q1',
    score: 75,
    completedAt: '2024-03-10T14:30:00Z',
  },
];

export const LEVEL_LABELS: Record<string, string> = {
  DEBUTANT: 'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

export const LEVEL_COLORS: Record<string, string> = {
  DEBUTANT: 'bg-green-100 text-green-700',
  INTERMEDIAIRE: 'bg-yellow-100 text-yellow-700',
  AVANCE: 'bg-red-100 text-red-700',
};

export const CATEGORIES = ['Tous', 'Développement Web', 'Data Science', 'DevOps', 'Mobile', 'Cybersécurité'];
