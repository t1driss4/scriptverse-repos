import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Réinitialisation du mot de passe</h1>
          <p className="mt-1 text-sm text-gray-500">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              className="input"
            />
          </div>

          {/* Submit */}
          <button className="btn-primary w-full">
            Envoyer le lien de réinitialisation
          </button>
        </div>

        {/* Back to login */}
        <p className="text-center text-sm text-gray-500">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            ← Retour à la connexion
          </Link>
        </p>

        {/* MVP notice */}
        <p className="text-center text-xs text-gray-400">
          Démo MVP — fonctionnalité non implémentée
        </p>
      </div>
    </div>
  );
}
