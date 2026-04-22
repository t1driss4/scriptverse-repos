import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mockCourses } from '@/lib/mock-data';

interface Props {
  params: { id: string; chapitreId: string };
}

export default function ChapterPage({ params }: Props) {
  const course = mockCourses.find((c) => c.id === params.id);
  if (!course) notFound();

  // Flatten all lessons from all modules for navigation
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const lessonIndex = allLessons.findIndex((l) => l.id === params.chapitreId);
  if (lessonIndex === -1) notFound();

  const lesson = allLessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-700 bg-gray-900 h-14 flex items-center px-4 gap-4">
        <Link
          href={`/cours/${course.id}`}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="hidden sm:block truncate max-w-xs">{course.title}</span>
        </Link>

        <div className="flex-1" />

        {/* Progress indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <span>
            {lessonIndex + 1} / {allLessons.length}
          </span>
          <div className="w-24 h-1.5 rounded-full bg-gray-700">
            <div
              className="h-1.5 rounded-full bg-primary-500 transition-all"
              style={{ width: `${((lessonIndex + 1) / allLessons.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Lesson sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Programme</p>
          </div>
          {course.modules.map((mod) => (
            <div key={mod.id}>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-800/50">
                {mod.title}
              </p>
              <ul className="divide-y divide-gray-800">
                {mod.lessons.map((l, idx) => {
                  const isCurrent = l.id === params.chapitreId;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/cours/${course.id}/chapitre/${l.id}`}
                        className={`flex items-start gap-3 p-4 transition-colors ${
                          isCurrent ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            l.completed
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {l.completed ? (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${isCurrent ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {l.title}
                          </p>
                          <span className="text-xs text-gray-600 uppercase">{l.type}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* Video player */}
          <div className="bg-black aspect-video w-full max-h-[60vh] flex items-center justify-center">
            {lesson.url ? (
              <iframe
                src={lesson.url}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                title={lesson.title}
              />
            ) : (
              <div className="text-center space-y-3">
                <div className="mx-auto h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">{lesson.title}</p>
                <p className="text-gray-600 text-xs">Lecteur vidéo</p>
              </div>
            )}
          </div>

          {/* Lesson content */}
          <div className="mx-auto max-w-3xl px-4 sm:px-8 py-8 space-y-6">
            {/* Lesson header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-primary-600 mb-1">
                  Leçon {lessonIndex + 1} sur {allLessons.length}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              </div>
              {/* Mark complete button */}
              <button
                className={`shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  lesson.completed
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'btn-primary'
                }`}
              >
                {lesson.completed ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Terminé
                  </>
                ) : (
                  'Marquer comme terminé'
                )}
              </button>
            </div>

            {/* Resources */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Ressources de la leçon</h3>
              <ul className="space-y-2">
                {['Slides (PDF)', 'Code source — exercices', 'Liens utiles'].map((resource) => (
                  <li key={resource}>
                    <a href="#" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      {resource}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {prevLesson ? (
                <Link
                  href={`/cours/${course.id}/chapitre/${prevLesson.id}`}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Leçon précédente
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link
                  href={`/cours/${course.id}/chapitre/${nextLesson.id}`}
                  className="btn-primary flex items-center gap-2"
                >
                  Leçon suivante
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ) : (
                <Link href={`/cours/${course.id}`} className="btn-primary">
                  Terminer le cours
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
