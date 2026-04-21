import type { Course, User, Enrollment, QuizAttempt } from './types';

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

export const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'JavaScript Moderne — ES2024',
    description:
      'Maîtrisez les dernières fonctionnalités de JavaScript : async/await avancé, modules ES, Proxies, WeakRefs et bien plus encore. Ce cours vous donnera une maîtrise solide du langage pour des projets professionnels.',
    price: 49,
    level: 'INTERMEDIAIRE',
    category: 'Développement Web',
    status: 'PUBLISHED',
    formateur: mockFormateur,
    studentsCount: 1240,
    rating: 4.8,
    duration: 320,
    chapters: [
      {
        id: 'ch1',
        title: 'Introduction et environnement',
        order: 1,
        duration: 25,
        courseId: 'c1',
        completed: true,
        content:
          '## Introduction\n\nBienvenue dans ce cours sur JavaScript Moderne. Dans ce premier chapitre, nous allons configurer notre environnement de développement et passer en revue les bases du langage.\n\n### Prérequis\n- Node.js 20+\n- VS Code avec extensions ESLint et Prettier\n- Bases de HTML/CSS\n\n### Contenu du chapitre\n1. Installation de Node.js et npm\n2. Configuration de VS Code\n3. Rappels JavaScript ES6\n4. Introduction aux modules',
      },
      {
        id: 'ch2',
        title: 'Async/Await en profondeur',
        order: 2,
        duration: 40,
        courseId: 'c1',
        completed: true,
        content:
          '## Async/Await\n\nLes Promises et async/await transforment la façon d\'écrire du code asynchrone. Dans ce chapitre, nous explorons les patterns avancés.\n\n### Topics\n- Promise.all vs Promise.allSettled\n- Error handling avec try/catch\n- Async generators\n- Concurrence et parallélisme',
      },
      {
        id: 'ch3',
        title: 'Modules ES et bundlers',
        order: 3,
        duration: 35,
        courseId: 'c1',
        completed: false,
        content: '',
      },
      {
        id: 'ch4',
        title: 'Proxies et Reflect API',
        order: 4,
        duration: 30,
        courseId: 'c1',
        completed: false,
        content: '',
      },
      {
        id: 'ch5',
        title: 'Patterns avancés',
        order: 5,
        duration: 45,
        courseId: 'c1',
        completed: false,
        content: '',
      },
      {
        id: 'ch6',
        title: 'Projet final & évaluation',
        order: 6,
        duration: 60,
        courseId: 'c1',
        completed: false,
        content: '',
        quiz: {
          id: 'q1',
          title: 'Quiz — JavaScript Moderne',
          questions: [
            {
              id: 'qq1',
              order: 1,
              question: "Quelle méthode permet d'attendre la résolution d'une Promise ?",
              options: ['then()', 'await', 'resolve()', 'async()'],
              correctAnswer: 1,
            },
            {
              id: 'qq2',
              order: 2,
              question: 'Quel mot-clé est utilisé pour exporter une valeur depuis un module ES ?',
              options: ['import', 'export', 'require', 'module.exports'],
              correctAnswer: 1,
            },
            {
              id: 'qq3',
              order: 3,
              question: 'Quelle est la principale différence entre let et const ?',
              options: [
                'let est immutable, const est mutable',
                'const est immutable (réassignation interdite), let est mutable',
                'Aucune différence fonctionnelle',
                'let est à portée globale, const à portée locale',
              ],
              correctAnswer: 1,
            },
            {
              id: 'qq4',
              order: 4,
              question: 'Que se passe-t-il si l\'une des Promises passées à Promise.all() est rejetée ?',
              options: [
                'Seul le résultat des autres Promises est retourné',
                'La méthode retourne undefined',
                'La Promise globale est immédiatement rejetée',
                'La méthode attend que toutes les Promises soient résolues ou rejetées',
              ],
              correctAnswer: 2,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'c2',
    title: 'React & TypeScript — Applications Robustes',
    description:
      'Construisez des applications React scalables avec TypeScript, hooks personnalisés, Context API, React Query et les meilleures pratiques de l\'industrie pour des projets en équipe.',
    price: 59,
    level: 'AVANCE',
    category: 'Développement Web',
    status: 'PUBLISHED',
    formateur: mockFormateur,
    studentsCount: 876,
    rating: 4.9,
    duration: 280,
    chapters: [
      { id: 'ch7', title: 'TypeScript pour React', order: 1, duration: 30, courseId: 'c2', completed: true },
      { id: 'ch8', title: 'Hooks avancés et personnalisés', order: 2, duration: 45, courseId: 'c2', completed: false },
      { id: 'ch9', title: "Gestion d'état globale", order: 3, duration: 40, courseId: 'c2', completed: false },
      { id: 'ch10', title: 'Tests avec Vitest & RTL', order: 4, duration: 35, courseId: 'c2', completed: false },
    ],
  },
  {
    id: 'c3',
    title: 'Python pour la Data Science',
    description:
      'Pandas, NumPy, Matplotlib et Scikit-learn — de l\'analyse exploratoire au machine learning supervisé. Idéal pour les débutants en data science souhaitant progresser rapidement.',
    price: 69,
    level: 'DEBUTANT',
    category: 'Data Science',
    status: 'PUBLISHED',
    formateur: {
      id: 'f2',
      firstName: 'Thomas',
      lastName: 'Leblanc',
      email: 'thomas@scriptverse.dev',
      role: 'FORMATEUR',
    },
    studentsCount: 2100,
    rating: 4.7,
    duration: 410,
    chapters: [
      {
        id: 'ch11',
        title: 'Python et environnements virtuels',
        order: 1,
        duration: 20,
        courseId: 'c3',
        completed: false,
      },
      { id: 'ch12', title: 'NumPy — calcul vectorisé', order: 2, duration: 35, courseId: 'c3', completed: false },
      {
        id: 'ch13',
        title: 'Pandas — manipulation de données',
        order: 3,
        duration: 50,
        courseId: 'c3',
        completed: false,
      },
      {
        id: 'ch14',
        title: 'Visualisation avec Matplotlib',
        order: 4,
        duration: 30,
        courseId: 'c3',
        completed: false,
      },
      {
        id: 'ch15',
        title: 'Introduction au Machine Learning',
        order: 5,
        duration: 60,
        courseId: 'c3',
        completed: false,
      },
    ],
  },
  {
    id: 'c4',
    title: 'DevOps avec Docker & Kubernetes',
    description:
      'Conteneurisation, orchestration et CI/CD : déployez vos applications en production avec Docker, Docker Compose, Kubernetes et GitHub Actions. Cours orienté pratique avec projets réels.',
    price: 79,
    level: 'AVANCE',
    category: 'DevOps',
    status: 'DRAFT',
    formateur: mockFormateur,
    studentsCount: 0,
    rating: 0,
    duration: 360,
    chapters: [
      { id: 'ch16', title: 'Docker fundamentals', order: 1, duration: 40, courseId: 'c4', completed: false },
      { id: 'ch17', title: 'Docker Compose et multi-services', order: 2, duration: 30, courseId: 'c4', completed: false },
      { id: 'ch18', title: 'Kubernetes basics', order: 3, duration: 60, courseId: 'c4', completed: false },
      { id: 'ch19', title: 'CI/CD avec GitHub Actions', order: 4, duration: 45, courseId: 'c4', completed: false },
    ],
  },
];

export const mockEnrollments: Enrollment[] = [
  {
    courseId: 'c1',
    course: mockCourses[0],
    progress: 33,
    completedChapters: ['ch1', 'ch2'],
  },
  {
    courseId: 'c2',
    course: mockCourses[1],
    progress: 25,
    completedChapters: ['ch7'],
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
