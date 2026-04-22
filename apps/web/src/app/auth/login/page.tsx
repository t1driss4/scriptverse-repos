'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = "L'adresse email est requise.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Veuillez saisir une adresse email valide.";
  }
  if (!password) {
    errors.password = "Le mot de passe est requis.";
  }
  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role === 'FORMATEUR' ? '/formateur' : '/dashboard');
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError('');

    const fieldErrors = validate(email, password);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await login(email, password);
      // AuthContext sets user; useEffect above handles redirect
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue. Veuillez réessayer.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Connexion à ScriptVerse
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Accédez à vos cours et continuez votre apprentissage
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="card p-8 space-y-5">
            {/* API error banner */}
            {apiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <div className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Adresse email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mot de passe
                  </label>
                  <Link
                    href="/auth/reset-password"
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
              </div>
            </div>

            <Button type="submit" loading={submitting}>
              Se connecter
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">ou</span>
              </div>
            </div>

            {/* Google SSO placeholder */}
            <button
              type="button"
              className="btn-secondary w-full flex items-center justify-center gap-2"
              disabled
              title="Bientôt disponible"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Continuer avec Google
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
