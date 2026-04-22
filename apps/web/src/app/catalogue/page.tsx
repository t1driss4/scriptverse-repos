import { Navbar } from '@/components/layout/navbar';
import { CourseCard } from '@/components/course-card';
import { mockCourses, CATEGORIES, LEVEL_LABELS } from '@/lib/mock-data';

const PUBLISHED_COURSES = mockCourses.filter((c) => c.published);

export default function CataloguePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">Catalogue des formations</h1>
          <p className="text-primary-100 text-sm mb-6">
            {PUBLISHED_COURSES.length} cours disponibles — apprenez à votre rythme
          </p>

          {/* Search */}
          <div className="relative max-w-lg">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder="Rechercher une formation…"
              className="w-full rounded-lg border-0 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/60 backdrop-blur focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0 space-y-6">
            {/* Category */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Catégorie</h3>
              <ul className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <button
                      className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                        cat === 'Tous'
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Level */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Niveau</h3>
              <ul className="space-y-1">
                {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-2 px-3 py-1.5">
                    <input
                      type="checkbox"
                      id={`level-${key}`}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <label htmlFor={`level-${key}`} className="text-sm text-gray-600 cursor-pointer">
                      {label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Prix</h3>
              <ul className="space-y-1">
                {['Tous les prix', 'Gratuit', 'Moins de 50 €', '50 € – 100 €'].map((p) => (
                  <li key={p} className="flex items-center gap-2 px-3 py-1.5">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-600">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{PUBLISHED_COURSES.length}</span> résultats
              </p>
              <select className="input max-w-[180px] text-xs">
                <option>Trier par : Popularité</option>
                <option>Trier par : Note</option>
                <option>Trier par : Prix (croissant)</option>
                <option>Trier par : Prix (décroissant)</option>
                <option>Trier par : Nouveautés</option>
              </select>
            </div>

            {/* Course grid */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {PUBLISHED_COURSES.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-center gap-2">
              <button className="btn-secondary px-3 py-1.5 text-xs">Précédent</button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    page === 1
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="btn-secondary px-3 py-1.5 text-xs">Suivant</button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
