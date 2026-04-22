import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { mockEnrollments, mockQuizAttempts, mockUser } from '@/lib/mock-data';

const ACTIVITY = [
  { id: 1, type: 'chapter', label: 'Chapitre terminé — Async/Await en profondeur', course: 'JavaScript Moderne', time: 'Il y a 2h' },
  { id: 2, type: 'quiz', label: 'Quiz complété — JavaScript Moderne (75%)', course: 'JavaScript Moderne', time: 'Hier' },
  { id: 3, type: 'chapter', label: 'Chapitre terminé — Introduction et environnement', course: 'JavaScript Moderne', time: 'Il y a 3 jours' },
  { id: 4, type: 'enrollment', label: 'Inscrit au cours — React & TypeScript', course: 'React & TypeScript', time: 'Il y a 5 jours' },
];

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const completedCourses = 0;
  const inProgressCourses = mockEnrollments.length;
  const totalChaptersCompleted = mockEnrollments.reduce(
    (acc, e) => acc + e.completedChapters.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {mockUser.firstName} 👋
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <StatCard
            label="Quiz réussis"
            value={mockQuizAttempts.filter((a) => a.score >= 70).length}
            color="bg-purple-50"
            icon={
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
            }
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Enrolled courses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Mes cours en cours</h2>
              <Link href="/catalogue" className="text-xs text-primary-600 hover:text-primary-700">
                Voir le catalogue →
              </Link>
            </div>

            {mockEnrollments.map((enrollment) => {
              const { course, progress, completedChapters } = enrollment;
              const nextChapter = course.chapters.find((ch) => !completedChapters.includes(ch.id));
              return (
                <div key={enrollment.courseId} className="card p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Color thumbnail */}
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
                      <p className="text-xs text-gray-500 mt-0.5">
                        {course.formateur.firstName} {course.formateur.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {completedChapters.length} / {course.chapters.length} chapitres terminés
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-primary-600">{progress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Next chapter CTA */}
                  {nextChapter && (
                    <Link
                      href={`/cours/${course.id}/chapitre/${nextChapter.id}`}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                      </svg>
                      Reprendre — {nextChapter.title}
                    </Link>
                  )}
                </div>
              );
            })}

            {mockEnrollments.length === 0 && (
              <div className="card p-8 text-center text-gray-400">
                <p className="mb-3">Vous n&apos;êtes inscrit à aucun cours.</p>
                <Link href="/catalogue" className="btn-primary">Découvrir le catalogue</Link>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Activité récente</h2>
            <div className="card p-4">
              <ul className="space-y-4">
                {ACTIVITY.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    {/* Activity icon */}
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        item.type === 'chapter'
                          ? 'bg-blue-100 text-blue-600'
                          : item.type === 'quiz'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {item.type === 'chapter' && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                      {item.type === 'quiz' && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      )}
                      {item.type === 'enrollment' && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
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
    </div>
  );
}
