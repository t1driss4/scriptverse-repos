import Link from 'next/link';
import type { Course } from '@/lib/types';
import { LEVEL_COLORS, LEVEL_LABELS } from '@/lib/mock-data';

interface CourseCardProps {
  course: Course;
  progress?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating > 0 ? rating.toFixed(1) : '—'}</span>
    </div>
  );
}

// Deterministic thumbnail colour based on course id
const THUMBNAIL_COLORS = [
  'from-indigo-400 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-rose-500',
];

function getThumbnailGradient(courseId: string) {
  const index = courseId.charCodeAt(courseId.length - 1) % THUMBNAIL_COLORS.length;
  return THUMBNAIL_COLORS[index];
}

export function CourseCard({ course, progress }: CourseCardProps) {
  const gradient = getThumbnailGradient(course.id);
  const totalMinutes = course.duration;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h${minutes > 0 ? minutes : ''}` : `${minutes}min`;

  return (
    <Link href={`/cours/${course.id}`} className="group block">
      <div className="card overflow-hidden transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        <div className={`h-40 bg-gradient-to-br ${gradient} flex items-end p-3`}>
          <span className={`badge ${LEVEL_COLORS[course.level]}`}>{LEVEL_LABELS[course.level]}</span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-primary-600 mb-1">{course.category}</p>
            <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{course.description}</p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {course.formateur.firstName} {course.formateur.lastName}
            </span>
            <span>·</span>
            <span>{durationLabel}</span>
            <span>·</span>
            <span>{course.chapters.length} chapitres</span>
          </div>

          {course.rating > 0 && <StarRating rating={course.rating} />}

          {/* Progress bar (shown when enrolled) */}
          {progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progression</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-primary-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            {course.status === 'DRAFT' ? (
              <span className="badge bg-gray-100 text-gray-500">Brouillon</span>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {course.price === 0 ? 'Gratuit' : `${course.price} €`}
              </span>
            )}
            {course.studentsCount > 0 && (
              <span className="text-xs text-gray-400">{course.studentsCount.toLocaleString('fr-FR')} apprenants</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
