import { Navbar } from '@/components/layout/navbar';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

export default function CatalogueLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero skeleton */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-4">
          <div className="h-8 w-64 rounded-lg skeleton opacity-40" />
          <div className="h-4 w-52 rounded skeleton opacity-30" />
          <div className="h-10 w-full max-w-lg rounded-lg skeleton opacity-25" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar skeleton */}
          <aside className="lg:w-56 shrink-0 space-y-6">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg skeleton" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 rounded skeleton" />
              ))}
            </div>
          </aside>

          {/* Grid skeleton */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div className="h-4 w-24 skeleton" />
              <div className="h-8 w-44 skeleton rounded-lg" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
