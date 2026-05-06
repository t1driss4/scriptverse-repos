'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type { Course } from '@/lib/types';
import {
  PageTransition,
  FadeIn,
  StaggerCards,
  StaggerItem,
} from '@/components/animations';
import { motion, useReducedMotion } from 'framer-motion';

const LEVEL_LABELS: Record<string, string> = {
  DEBUTANT: 'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

type StatusFilter = 'all' | 'published' | 'draft';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const staggerItemVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const staggerItemReduced = { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };

function SkeletonRow() {
  return (
    <tr>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-14 rounded-lg hidden sm:block" />
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4 hidden sm:table-cell"><div className="skeleton h-5 w-16 rounded-full" /></td>
      <td className="py-4 px-4 hidden md:table-cell"><div className="skeleton h-4 w-8 rounded" /></td>
      <td className="py-4 px-4 hidden lg:table-cell"><div className="skeleton h-4 w-28 rounded" /></td>
      <td className="py-4 px-4"><div className="skeleton h-4 w-20 rounded ml-auto" /></td>
    </tr>
  );
}

function CourseTableBody({
  courses,
  onPublishToggle,
  isToggling,
}: {
  courses: Course[];
  onPublishToggle: (course: Course) => void;
  isToggling: string | null;
}) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.tbody
      className="divide-y divide-gray-100"
      variants={staggerContainer}
      initial={shouldReduce ? 'visible' : 'hidden'}
      animate="visible"
    >
      {courses.map((course) => {
        const totalLessons = (course.modules ?? []).reduce((acc, m) => acc + m.lessons.length, 0);
        const toggling = isToggling === course.id;
        return (
          <motion.tr
            key={course.id}
            className="hover:bg-gray-50 transition-colors"
            variants={shouldReduce ? staggerItemReduced : staggerItemVariant}
          >
            <td className="py-4 px-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 shrink-0 rounded-lg bg-gradient-to-br from-primary-400 to-indigo-500 hidden sm:block" />
                <div>
                  <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {LEVEL_LABELS[course.level] ?? course.level} · {course.price === 0 ? 'Gratuit' : `${course.price} €`}
                  </p>
                </div>
              </div>
            </td>
            <td className="py-4 px-4 hidden sm:table-cell">
              <span className={`badge ${course.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {course.published ? 'Publié' : 'Brouillon'}
              </span>
            </td>
            <td className="py-4 px-4 hidden md:table-cell text-gray-600">
              {(course._count?.enrollments ?? 0) > 0
                ? course._count!.enrollments.toLocaleString('fr-FR')
                : '—'}
            </td>
            <td className="py-4 px-4 hidden lg:table-cell text-gray-600">
              {(course.modules ?? []).length} module{(course.modules ?? []).length !== 1 ? 's' : ''} · {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
            </td>
            <td className="py-4 px-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onPublishToggle(course)}
                  disabled={toggling}
                  className={`text-xs font-medium transition-colors disabled:opacity-50 ${
                    course.published
                      ? 'text-amber-600 hover:text-amber-700'
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {toggling ? '…' : course.published ? 'Dépublier' : 'Publier'}
                </button>
                <Link
                  href={`/formateur/cours/${course.id}`}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Modifier
                </Link>
                <Link
                  href={`/cours/${course.id}`}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Aperçu
                </Link>
              </div>
            </td>
          </motion.tr>
        );
      })}
    </motion.tbody>
  );
}

export default function FormateurPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      setError(null);
      const data = await coursesApi.findMine(token);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'FORMATEUR') {
        router.replace('/');
        return;
      }
      fetchCourses();
    }
  }, [authLoading, user, router, fetchCourses]);

  async function handlePublishToggle(course: Course) {
    const token = getAccessToken();
    if (!token) return;
    setIsToggling(course.id);
    try {
      const updated = await coursesApi.update(token, course.id, { published: !course.published });
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsToggling(null);
    }
  }

  const filtered = courses.filter((c) => {
    if (statusFilter === 'published') return c.published;
    if (statusFilter === 'draft') return !c.published;
    return true;
  });

  const publishedCount = courses.filter((c) => c.published).length;
  const totalEnrollments = courses.reduce((acc, c) => acc + (c._count?.enrollments ?? 0), 0);

  const stats = [
    { label: 'Cours créés', value: courses.length, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Cours publiés', value: publishedCount, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Apprenants inscrits', value: totalEnrollments.toLocaleString('fr-FR'), color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <PageTransition>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
          {/* Header */}
          <FadeIn direction="up" delay={0}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Espace Formateur</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Gérez vos cours, suivez vos apprenants et publiez du nouveau contenu.
                </p>
              </div>
              <Link href="/formateur/cours/nouveau" className="btn-primary flex items-center gap-2 shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouveau cours
              </Link>
            </div>
          </FadeIn>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button onClick={() => { setError(null); fetchCourses(); }} className="text-xs text-red-600 hover:text-red-700 font-medium">
                Réessayer
              </button>
            </div>
          )}

          {/* Stats */}
          <StaggerCards className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className={`card p-5 ${stat.bg}`}>
                  {loading ? (
                    <div className="skeleton h-8 w-12 rounded mb-1" />
                  ) : (
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerCards>

          {/* Course list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Mes cours</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="input text-xs max-w-[140px]"
              >
                <option value="all">Tous les statuts</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Cours</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Statut</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">Apprenants</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Modules</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody className="divide-y divide-gray-100">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                  </tbody>
                ) : (
                  <CourseTableBody
                    courses={filtered}
                    onPublishToggle={handlePublishToggle}
                    isToggling={isToggling}
                  />
                )}
              </table>

              {!loading && filtered.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  {courses.length === 0 ? (
                    <>
                      <p className="mb-3">Vous n&apos;avez pas encore créé de cours.</p>
                      <Link href="/formateur/cours/nouveau" className="btn-primary">Créer mon premier cours</Link>
                    </>
                  ) : (
                    <p>Aucun cours ne correspond à ce filtre.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="card p-5 border-l-4 border-primary-500 bg-primary-50">
            <p className="text-sm font-semibold text-primary-900 mb-1">Conseil formateur</p>
            <p className="text-sm text-primary-700">
              Organisez votre cours en modules thématiques, ajoutez des leçons vidéo et des quiz pour maximiser l&apos;engagement de vos apprenants !
            </p>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
