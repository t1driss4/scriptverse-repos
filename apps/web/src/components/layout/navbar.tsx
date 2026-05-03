import Link from 'next/link';

interface NavbarProps {
  role?: 'APPRENANT' | 'FORMATEUR' | 'ADMIN';
  userName?: string;
}

export function Navbar({ role = 'APPRENANT', userName = 'Bob D.' }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/catalogue" className="flex items-center gap-2 font-bold text-primary-600 text-lg">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          ScriptVerse
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/catalogue" className="hover:text-primary-600 transition-colors">
            Catalogue
          </Link>
          <Link href="/dashboard" className="hover:text-primary-600 transition-colors">
            Mon espace
          </Link>
          {role === 'FORMATEUR' && (
            <Link href="/formateur" className="hover:text-primary-600 transition-colors">
              Mes cours
            </Link>
          )}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
              {userName.slice(0, 1)}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{userName}</span>
          </div>
          <Link
            href="/auth/login"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Déconnexion
          </Link>
        </div>
      </div>
    </header>
  );
}
