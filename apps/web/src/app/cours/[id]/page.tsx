import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { mockCourses, LEVEL_LABELS, LEVEL_COLORS } from '@/lib/mock-data';

interface Props {
  params: { id: string };
}

export default function CourseDetailPage({ params }: Props) {
  const course = mockCourses.find((c) => c.id === params.id);
  if (!course) notFound();

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const isEnrolled = ['c1', 'c2'].includes(course.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Course hero */}
      <div className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="lg:max-w-3xl space-y-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-gray-400">
              <Link href="/catalogue" className="hover:text-white transition-colors">
                Catalogue
              </Link>
              <span>/</span>
              <span>{course.category}</span>
              <span>/</span>
              <span className="text-gray-200 truncate max-w-xs">{course.title}</span>
            </nav>

            {/* Level badge */}
            <span className={`badge ${LEVEL_COLORS[course.level]}`}>{LEVEL_LABELS[course.level]}</span>

            {/* Title */}
            <h1 className="text-3xl font-bold leading-tight">{course.title}</h1>

            {/* Description */}
            <p className="text-gray-300 text-sm leading-relaxed">{course.description}</p>

            {/* Meta */}
            {course.formateur && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-400">
                  Par{' '}
                  <span className="text-white font-medium">
                    {course.formateur.firstName} {course.formateur.lastName}
                  </span>
                </span>
              </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-300 pt-1">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
                {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} · {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
              </div>
              {(course._count?.enrollments ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  {course._count!.enrollments.toLocaleString('fr-FR')} apprenants
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* What you'll learn */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Ce que vous apprendrez</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  'Maîtriser les fonctionnalités ES2024',
                  'Écrire du code asynchrone robuste',
                  'Structurer des projets modulaires',
                  'Utiliser les Proxies et Reflect API',
                  'Appliquer les patterns avancés',
                  'Réaliser un projet complet de A à Z',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-lg">Programme du cours</h2>
                <span className="text-xs text-gray-500">
                  {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} · {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {course.modules.map((mod) => (
                  <div key={mod.id}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Module {mod.order} — {mod.title}
                    </p>
                    <ul className="divide-y divide-gray-100">
                      {mod.lessons.map((lesson, idx) => (
                        <li key={lesson.id} className="flex items-center gap-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                          </div>
                          <span className="shrink-0 text-xs text-gray-400 uppercase">{lesson.type}</span>
                          {isEnrolled ? (
                            <Link
                              href={`/cours/${course.id}/chapitre/${lesson.id}`}
                              className="shrink-0 text-primary-600 hover:text-primary-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                              </svg>
                            </Link>
                          ) : (
                            <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            {course.formateur && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Votre formateur</h2>
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-lg font-bold">
                    {course.formateur.firstName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {course.formateur.firstName} {course.formateur.lastName}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">Formateur certifié · Développeur Senior</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Passionné par la transmission du savoir, {course.formateur.firstName} a plus de 10 ans d&apos;expérience
                      dans l&apos;industrie et a formé des milliers d&apos;apprenants sur ScriptVerse.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky enroll card */}
          <div className="lg:w-80 shrink-0">
            <div className="card p-6 sticky top-20 space-y-4">
              {/* Video preview placeholder */}
              <div className="relative h-44 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="h-7 w-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                </div>
                <span className="absolute bottom-3 left-3 text-white text-xs font-medium">Aperçu gratuit</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {course.price === 0 ? 'Gratuit' : `${course.price} €`}
                </span>
                {course.price > 0 && (
                  <span className="text-sm text-gray-400 line-through">{Math.round(course.price * 1.5)} €</span>
                )}
              </div>

              {/* CTA */}
              {isEnrolled && allLessons[0] ? (
                <Link
                  href={`/cours/${course.id}/chapitre/${allLessons[0].id}`}
                  className="btn-primary w-full text-center block"
                >
                  Continuer le cours
                </Link>
              ) : (
                <button className="btn-primary w-full">S&apos;inscrire maintenant</button>
              )}
              <button className="btn-secondary w-full">Ajouter aux favoris</button>

              {/* Guarantees */}
              <ul className="space-y-2 text-xs text-gray-500">
                {[
                  'Accès à vie au contenu',
                  'Certificat de complétion',
                  'Satisfait ou remboursé 30 jours',
                  'Accès mobile et desktop',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
