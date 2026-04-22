'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError('');

    if (!email.trim()) {
      setEmailError("L'adresse email est requise.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Veuillez saisir une adresse email valide.");
      return;
    }
    setEmailError('');

    setSubmitting(true);
    try {
      await authApi.resetPassword(email);
      setSubmitted(true);
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
            Réinitialisation du mot de passe
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Saisissez votre adresse email pour recevoir un lien de
            réinitialisation
          </p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="card p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Email envoyé
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Si cette adresse est associée à un compte, vous recevrez un
                lien de réinitialisation sous peu.
              </p>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} noValidate>
            <div className="card p-8 space-y-5">
              {apiError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <Input
                id="email"
                type="email"
                label="Adresse email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />

              <Button type="submit" loading={submitting}>
                Envoyer le lien de réinitialisation
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link
            href="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
