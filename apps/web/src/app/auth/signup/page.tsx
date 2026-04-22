import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer votre compte</h1>
          <p className="mt-1 text-sm text-gray-500">Rejoignez ScriptVerse et commencez à apprendre</p>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input id="firstName" type="text" placeholder="Jean" className="input" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input id="lastName" type="text" placeholder="Dupont" className="input" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input id="email" type="email" placeholder="vous@exemple.com" className="input" />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input id="password" type="password" placeholder="8 caractères minimum" className="input" />
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input id="confirmPassword" type="password" placeholder="••••••••" className="input" />
          </div>

          {/* Role selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Je suis…</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Apprenant */}
              <label className="relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-primary-500 bg-primary-50 p-4 text-center">
                <input type="radio" name="role" value="APPRENANT" className="sr-only" defaultChecked />
                <svg className="mb-2 h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
                <span className="text-sm font-semibold text-primary-700">Apprenant</span>
                <span className="text-xs text-gray-500 mt-0.5">Je veux apprendre</span>
              </label>

              {/* Formateur */}
              <label className="relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-gray-200 bg-white p-4 text-center hover:border-primary-300 transition-colors">
                <input type="radio" name="role" value="FORMATEUR" className="sr-only" />
                <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Formateur</span>
                <span className="text-xs text-gray-500 mt-0.5">Je veux enseigner</span>
              </label>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input id="terms" type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
              J&apos;accepte les{' '}
              <span className="text-primary-600 cursor-pointer hover:underline">conditions d&apos;utilisation</span> et la{' '}
              <span className="text-primary-600 cursor-pointer hover:underline">politique de confidentialité</span>
            </label>
          </div>

          {/* Submit */}
          <Link href="/catalogue" className="btn-primary w-full text-center block">
            Créer mon compte
          </Link>
        </div>

        {/* Login */}
        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
