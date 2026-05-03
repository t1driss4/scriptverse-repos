import { Navbar } from '@/components/layout/navbar';
import { PageTransition } from '@/components/animations';
import { CatalogueClient } from './CatalogueClient';
import type { Course } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchCourses(): Promise<Course[]> {
  try {
    const res = await fetch(`${API_URL}/courses`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json() as Promise<Course[]>;
  } catch {
    return [];
  }
}

export default async function CataloguePage() {
  const courses = await fetchCourses();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PageTransition>
        <CatalogueClient initialCourses={courses} />
      </PageTransition>
    </div>
  );
}
