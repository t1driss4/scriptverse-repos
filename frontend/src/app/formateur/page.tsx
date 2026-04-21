import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { mockCourses, mockFormateur, LEVEL_LABELS } from '@/lib/mock-data';

const FORMATEUR_COURSES = mockCourses.filter((c) => c.formateur.id === mockFormateur.id);

const STATUS_STYLES = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-500',
  ARCHIVED: 'bg-orange-100 text-orange-600',
};
const STATUS_LABELS = { PUBLISHED: 'Publié', DRAFT: 'Brouillon', ARCHIVED: 'Archivé' };

export default function FormateurPage() {
  const totalStudents = FORMATEUR_COURSES.reduce((acc, c) => acc + c.studentsCount, 0);
  const avgRating =
    FORMATEUR_COURSES.filter((c) => c.rating > 0).reduce((acc, c) => acc + c.rating, 0) /
      (FORMATEUR_COURSES.filter((c) => c.rating > 0).length || 1);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Cours créés', value: FORMATEUR_COURSES.length, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'Cours publiés', value: FORMATEUR_COURSES.filter((c) => c.status === 'PUBLISHED').length, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Apprenants inscrits', value: totalStudents.toLocaleString('fr-FR'), color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Note moyenne', value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : '—', color: 'text-purple-600', bg: 'bg-purple-50' },
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
                <option>Archivés</option>
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
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Note</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Chapitres</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {FORMATEUR_COURSES.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 rounded-lg bg-gradient-to-br from-primary-400 to-indigo-500 hidden sm:block" />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{LEVEL_LABELS[course.level]} · {course.price === 0 ? 'Gratuit' : `${course.price} €`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className={`badge ${STATUS_STYLES[course.status]}`}>
                        {STATUS_LABELS[course.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-gray-600">
                      {course.studentsCount > 0 ? course.studentsCount.toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      {course.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{course.rating}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell text-gray-600">
                      {course.chapters.length}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {course.status === 'DRAFT' && (
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
                ))}
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
            Les cours avec des quiz ont un taux de complétion 40% supérieur. Pensez à ajouter un quiz après chaque chapitre important !
          </p>
        </div>
      </div>
    </div>
  );
}
