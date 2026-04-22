import Link from 'next/link';
import type { Course } from '@/lib/types';
import { LEVEL_COLORS, LEVEL_LABELS } from '@/lib/mock-data';

interface CourseCardProps {
  course: Course;
  progress?: number;
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
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

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
            {course.formateur && (
              <>
                <span>
                  {course.formateur.firstName} {course.formateur.lastName}
                </span>
                <span>·</span>
              </>
            )}
            <span>{course.modules.length} module{course.modules.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{totalLessons} leçon{totalLessons !== 1 ? 's' : ''}</span>
          </div>

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
            {!course.published ? (
              <span className="badge bg-gray-100 text-gray-500">Brouillon</span>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {course.price === 0 ? 'Gratuit' : `${course.price} €`}
              </span>
            )}
            {(course._count?.enrollments ?? 0) > 0 && (
              <span className="text-xs text-gray-400">
                {(course._count!.enrollments).toLocaleString('fr-FR')} apprenants
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
