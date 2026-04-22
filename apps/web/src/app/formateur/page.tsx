import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { mockCourses, mockFormateur, LEVEL_LABELS } from '@/lib/mock-data';

const FORMATEUR_COURSES = mockCourses.filter((c) => c.formateur?.id === mockFormateur.id);

export default function FormateurPage() {
  const publishedCount = FORMATEUR_COURSES.filter((c) => c.published).length;
  const totalEnrollments = FORMATEUR_COURSES.reduce((acc, c) => acc + (c._count?.enrollments ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="FORMATEUR" userName={`${mockFormateur.firstName} M.`} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Cours créés', value: FORMATEUR_COURSES.length, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'Cours publiés', value: publishedCount, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Apprenants inscrits', value: totalEnrollments.toLocaleString('fr-FR'), color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className={`card p-5 ${stat.bg}`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Course list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mes cours</h2>
            <div className="flex items-center gap-2">
              <select className="input text-xs max-w-[140px]">
                <option>Tous les statuts</option>
                <option>Publiés</option>
                <option>Brouillons</option>
              </select>
            </div>
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
              <tbody className="divide-y divide-gray-100">
                {FORMATEUR_COURSES.map((course) => {
                  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                  return (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 shrink-0 rounded-lg bg-gradient-to-br from-primary-400 to-indigo-500 hidden sm:block" />
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {LEVEL_LABELS[course.level]} · {course.price === 0 ? 'Gratuit' : `${course.price} €`}
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
                        {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} · {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!course.published && (
                            <button className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors">
                              Publier
                            </button>
                          )}
                          <Link
                            href={`/formateur/cours/${course.id}`}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                          >
                            Modifier
                          </Link>
                          <button className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                            Aperçu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {FORMATEUR_COURSES.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <p className="mb-3">Vous n&apos;avez pas encore créé de cours.</p>
                <Link href="/formateur/cours/nouveau" className="btn-primary">Créer mon premier cours</Link>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="card p-5 border-l-4 border-primary-500 bg-primary-50">
          <p className="text-sm font-semibold text-primary-900 mb-1">Conseil formateur</p>
          <p className="text-sm text-primary-700">
            Organisez votre cours en modules thématiques et ajoutez des leçons vidéo pour maximiser l&apos;engagement de vos apprenants !
          </p>
        </div>
      </div>
    </div>
  );
}
