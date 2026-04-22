'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Role = 'APPRENANT' | 'FORMATEUR';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(
  email: string,
  password: string,
  confirmPassword: string,
): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = "L'adresse email est requise.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Veuillez saisir une adresse email valide.";
  }
  if (!password) {
    errors.password = "Le mot de passe est requis.";
  } else if (password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Veuillez confirmer votre mot de passe.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas.";
  }
  return errors;
}

export default function SignupPage() {
  const router = useRouter();
  const { user, isLoading, signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('APPRENANT');
  const [termsAccepted, setTermsAccepted] = useState(false);
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

    const fieldErrors = validate(email, password, confirmPassword);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!termsAccepted) {
      setApiError(
        "Veuillez accepter les conditions d'utilisation pour continuer.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await signup({ email, password, role });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
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
            Créer votre compte
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Rejoignez ScriptVerse et commencez à apprendre
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

            {/* Email */}
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

            {/* Password */}
            <Input
              id="password"
              type="password"
              label="Mot de passe"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            {/* Confirm password */}
            <Input
              id="confirmPassword"
              type="password"
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            {/* Role selector */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Je suis…
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Apprenant */}
                <label
                  className={`relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 text-center transition-colors ${
                    role === 'APPRENANT'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="APPRENANT"
                    checked={role === 'APPRENANT'}
                    onChange={() => setRole('APPRENANT')}
                    className="sr-only"
                  />
                  <svg
                    className={`mb-2 h-8 w-8 ${role === 'APPRENANT' ? 'text-primary-600' : 'text-gray-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                    />
                  </svg>
                  <span
                    className={`text-sm font-semibold ${role === 'APPRENANT' ? 'text-primary-700' : 'text-gray-700'}`}
                  >
                    Apprenant
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    Je veux apprendre
                  </span>
                </label>

                {/* Formateur */}
                <label
                  className={`relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 text-center transition-colors ${
                    role === 'FORMATEUR'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="FORMATEUR"
                    checked={role === 'FORMATEUR'}
                    onChange={() => setRole('FORMATEUR')}
                    className="sr-only"
                  />
                  <svg
                    className={`mb-2 h-8 w-8 ${role === 'FORMATEUR' ? 'text-primary-600' : 'text-gray-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  <span
                    className={`text-sm font-semibold ${role === 'FORMATEUR' ? 'text-primary-700' : 'text-gray-700'}`}
                  >
                    Formateur
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    Je veux enseigner
                  </span>
                </label>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              <label
                htmlFor="terms"
                className="text-xs text-gray-500 leading-relaxed"
              >
                J&apos;accepte les{' '}
                <span className="text-primary-600 cursor-pointer hover:underline">
                  conditions d&apos;utilisation
                </span>{' '}
                et la{' '}
                <span className="text-primary-600 cursor-pointer hover:underline">
                  politique de confidentialité
                </span>
              </label>
            </div>

            <Button type="submit" loading={submitting}>
              Créer mon compte
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
