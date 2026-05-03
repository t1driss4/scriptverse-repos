'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentsApi } from '@/lib/api';
import { AuthExpiredError, ApiError } from '@/lib/api-client';

interface UseEnrollmentResult {
  isEnrolled: boolean;
  progress: number;
  enroll: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useEnrollment(courseId: string): UseEnrollmentResult {
  const { user } = useAuth();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollment = useCallback(async () => {
    if (!user) return;
    try {
      const data = await enrollmentsApi.findOne(courseId);
      setIsEnrolled(true);
      setProgress(data.progress);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setIsEnrolled(false);
        setProgress(0);
      }
      // other errors: leave state unchanged, don't surface — enroll() will surface errors
    }
  }, [user, courseId]);

  useEffect(() => {
    void fetchEnrollment();
  }, [fetchEnrollment]);

  const enroll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await enrollmentsApi.enroll(courseId);
      await fetchEnrollment();
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        router.push('/auth/login');
        return;
      }
      if (err instanceof ApiError) {
        if (err.status === 404) setError('Ce cours est introuvable.');
        else if (err.status === 409) setError('Vous êtes déjà inscrit à ce cours.');
        else if (err.status === 403) setError('Accès refusé.');
        else setError('Une erreur est survenue. Veuillez réessayer.');
      } else {
        setError('Erreur lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, fetchEnrollment, router]);

  return { isEnrolled, progress, enroll, isLoading, error };
}
