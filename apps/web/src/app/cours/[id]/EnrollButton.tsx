'use client';

import Link from 'next/link';
import { useEnrollment } from '@/hooks/use-enrollment';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  courseId: string;
  firstLessonId?: string;
}

export function EnrollButton({ courseId, firstLessonId }: EnrollButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { isEnrolled, enroll, isLoading, error } = useEnrollment(courseId);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    await enroll();
  };

  if (isLoading) {
    return (
      <button disabled className="btn-primary w-full flex items-center justify-center gap-2 opacity-70">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Chargement…
      </button>
    );
  }

  if (isEnrolled && firstLessonId) {
    return (
      <Link
        href={`/cours/${courseId}/chapitre/${firstLessonId}`}
        className="btn-primary w-full text-center block"
      >
        Continuer le cours
      </Link>
    );
  }

  if (isEnrolled) {
    return (
      <Link href={`/cours/${courseId}`} className="btn-primary w-full text-center block">
        Accéder au cours
      </Link>
    );
  }

  return (
    <>
      {error && (
        <p className="text-xs text-red-600 text-center -mb-1">{error}</p>
      )}
      <button onClick={handleEnroll} className="btn-primary w-full">
        S&apos;inscrire maintenant
      </button>
    </>
  );
}
