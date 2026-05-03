'use client';

import { useState, useMemo } from 'react';
import { CourseCard } from '@/components/course-card';
import { StaggerCards, StaggerItem, FadeIn } from '@/components/animations';
import { CATEGORIES, LEVEL_LABELS } from '@/lib/mock-data';
import type { Course } from '@/lib/types';

const ITEMS_PER_PAGE = 9;

interface CatalogueClientProps {
  initialCourses: Course[];
}

export function CatalogueClient({ initialCourses }: CatalogueClientProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tous');
  const [levels, setLevels] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<'all' | 'free' | 'under50' | '50to100'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCourses = useMemo(() => {
    let result = initialCourses;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }

    if (category !== 'Tous') {
      result = result.filter((c) => c.category === category);
    }

    if (levels.length > 0) {
      result = result.filter((c) => levels.includes(c.level));
    }

    if (priceRange === 'free') {
      result = result.filter((c) => c.price === 0);
    } else if (priceRange === 'under50') {
      result = result.filter((c) => c.price > 0 && c.price < 50);
    } else if (priceRange === '50to100') {
      result = result.filter((c) => c.price >= 50 && c.price <= 100);
    }

    return result;
  }, [initialCourses, query, category, levels, priceRange]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageCourses = filteredCourses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleLevel = (level: string) => {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
    setCurrentPage(1);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    setCurrentPage(1);
  };

  const handlePriceRange = (range: typeof priceRange) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleQuery = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const priceOptions: { label: string; value: typeof priceRange }[] = [
    { label: 'Tous les prix', value: 'all' },
    { label: 'Gratuit', value: 'free' },
    { label: 'Moins de 50 €', value: 'under50' },
    { label: '50 € – 100 €', value: '50to100' },
  ];

  return (
    <>
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <FadeIn direction="up" delay={0}>
            <h1 className="text-3xl font-bold mb-2">Catalogue des formations</h1>
            <p className="text-primary-100 text-sm mb-6">
              {initialCourses.length} cours disponibles — apprenez à votre rythme
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.08}>
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
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                placeholder="Rechercher une formation…"
                className="w-full rounded-lg border-0 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/60 backdrop-blur focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <FadeIn direction="left" delay={0.1}>
            <aside className="lg:w-56 shrink-0 space-y-6">
              {/* Category */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Catégorie</h3>
                <ul className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <li key={cat}>
                      <button
                        onClick={() => handleCategory(cat)}
                        className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                          cat === category
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
                        checked={levels.includes(key)}
                        onChange={() => toggleLevel(key)}
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
                  {priceOptions.map(({ label, value }) => (
                    <li key={value} className="flex items-center gap-2 px-3 py-1.5">
                      <input
                        type="radio"
                        id={`price-${value}`}
                        name="priceRange"
                        checked={priceRange === value}
                        onChange={() => handlePriceRange(value)}
                        className="h-4 w-4 border-gray-300 text-primary-600"
                      />
                      <label htmlFor={`price-${value}`} className="text-sm text-gray-600 cursor-pointer">
                        {label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </FadeIn>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{filteredCourses.length}</span> résultats
              </p>
              <select className="input max-w-[180px] text-xs">
                <option>Trier par : Popularité</option>
                <option>Trier par : Note</option>
                <option>Trier par : Prix (croissant)</option>
                <option>Trier par : Prix (décroissant)</option>
                <option>Trier par : Nouveautés</option>
              </select>
            </div>

            {pageCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p className="text-gray-500 font-medium">Aucun cours ne correspond à vos filtres</p>
                <p className="text-gray-400 text-sm mt-1">Essayez d&apos;ajuster vos critères de recherche</p>
              </div>
            ) : (
              <StaggerCards className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageCourses.map((course) => (
                  <StaggerItem key={course.id}>
                    <CourseCard course={course} />
                  </StaggerItem>
                ))}
              </StaggerCards>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <FadeIn delay={0.2}>
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </FadeIn>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
