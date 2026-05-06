'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentsApi } from '@/lib/api';
import type { Enrollment } from '@/lib/types';
import {
  PageTransition,
  FadeIn,
  StaggerCards,
  StaggerItem,
  AnimatedCounter,
  AnimatedProgress,
} from '@/components/animations';
import { motion, useReducedMotion } from 'framer-motion';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const staggerItemVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerItemReduced = { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };

function ActivityIcon({ type }: { type: string }) {
  if (type === 'quiz') {
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  if (type === 'enrollment') {
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const { course, progress, completedModules } = enrollment;
  const allLessons = (course.modules ?? []).flatMap((m) => m.lessons);
  const nextLesson = allLessons.find((l) => !completedModules.includes(l.id));

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="h-14 w-20 shrink-0 rounded-lg bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/cours/${course.id}`}
            className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1"
          >
            {course.title}
          </Link>
          {course.formateur && (
            <p className="text-xs text-gray-500 mt-0.5">
              {course.formateur.firstName} {course.formateur.lastName}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {completedModules.length} / {allLessons.length} leçons terminées
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-primary-600">{progress}%</span>
      </div>

      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-gray-100">
          <AnimatedProgress value={progress} className="h-2 rounded-full bg-primary-500" />
        </div>
      </div>

      {nextLesson && (
        <Link
          href={`/cours/${course.id}/chapitre/${nextLesson.id}`}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
          Reprendre — {nextLesson.title}
        </Link>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <AnimatedCounter value={value} className="text-2xl font-bold text-gray-900" />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const shouldReduce = useReducedMotion();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(true);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Client-side auth guard (belt-and-suspenders after middleware)
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    enrollmentsApi
      .findMine()
      .then(setEnrollments)
      .catch((err: unknown) => {
        setEnrollError(err instanceof Error ? err.message : 'Erreur de chargement');
      })
      .finally(() => setEnrollLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!user) return null;

  const inProgressCourses = enrollments.filter((e) => e.progress < 100).length;
  const completedCourses = enrollments.filter((e) => e.progress >= 100).length;
  const totalChaptersCompleted = enrollments.reduce((acc, e) => acc + e.completedModules.length, 0);

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <PageTransition>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
          {/* Welcome */}
          <FadeIn direction="up" delay={0}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bonjour, {displayName} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">Continuez votre progression — vous êtes sur la bonne voie !</p>
              </div>
              <Link href="/catalogue" className="btn-primary hidden sm:flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouveau cours
              </Link>
            </div>
          </FadeIn>

          {/* Stats */}
          <StaggerCards className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StaggerItem>
              <StatCard
                label="Cours en cours"
                value={inProgressCourses}
                color="bg-primary-50"
                icon={
                  <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                }
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Cours terminés"
                value={completedCourses}
                color="bg-green-50"
                icon={
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Chapitres lus"
                value={totalChaptersCompleted}
                color="bg-amber-50"
                icon={
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                  </svg>
                }
              />
            </StaggerItem>
          </StaggerCards>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Enrolled courses */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Mes cours en cours</h2>
                <Link href="/catalogue" className="text-xs text-primary-600 hover:text-primary-700">
                  Voir le catalogue →
                </Link>
              </div>

              {enrollLoading && (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="card p-5 animate-pulse space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-20 shrink-0 rounded-lg bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-gray-200" />
                          <div className="h-3 w-1/2 rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              )}

              {enrollError && (
                <div className="card p-5 border border-red-100 bg-red-50 text-sm text-red-600">
                  {enrollError}
                </div>
              )}

              {!enrollLoading && !enrollError && (
                <StaggerCards className="space-y-4">
                  {enrollments
                    .filter((e) => e.progress < 100)
                    .map((enrollment) => (
                      <StaggerItem key={enrollment.courseId}>
                        <EnrollmentCard enrollment={enrollment} />
                      </StaggerItem>
                    ))}
                </StaggerCards>
              )}

              {!enrollLoading && !enrollError && enrollments.filter((e) => e.progress < 100).length === 0 && (
                <div className="card p-8 text-center text-gray-400">
                  <p className="mb-3">Vous n&apos;êtes inscrit à aucun cours en cours.</p>
                  <Link href="/catalogue" className="btn-primary">Découvrir le catalogue</Link>
                </div>
              )}
            </div>

            {/* Recent + Certificates */}
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Récemment terminés</h2>
              <div className="card p-4">
                {enrollments.filter((e) => e.progress >= 100).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun cours terminé pour l&apos;instant</p>
                ) : (
                  <motion.ul
                    className="space-y-3"
                    variants={staggerContainer}
                    initial={shouldReduce ? 'visible' : 'hidden'}
                    animate="visible"
                  >
                    {enrollments
                      .filter((e) => e.progress >= 100)
                      .map((e) => (
                        <motion.li
                          key={e.courseId}
                          className="flex items-center gap-3"
                          variants={shouldReduce ? staggerItemReduced : staggerItemVariant}
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <ActivityIcon type="chapter" />
                          </div>
                          <Link
                            href={`/cours/${e.courseId}`}
                            className="flex-1 text-xs text-gray-700 hover:text-primary-600 line-clamp-1"
                          >
                            {e.course.title}
                          </Link>
                        </motion.li>
                      ))}
                  </motion.ul>
                )}
              </div>

              {/* Certificate placeholder */}
              <div className="card p-5 border-dashed border-2 border-gray-200 text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Certificats</p>
                <p className="text-xs text-gray-400">Terminez un cours pour obtenir votre certificat</p>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
