import type { ReactNode } from 'react';

// ──── Primitives ──────────────────────────────────────────────────────────────

function WireBox({
  label = '',
  height = 32,
  color = '#e5e7eb',
  textColor = '#9ca3af',
  bold = false,
  transparent = false,
}: {
  label?: string;
  height?: number;
  color?: string;
  textColor?: string;
  bold?: boolean;
  transparent?: boolean;
}) {
  return (
    <div
      style={{ height, backgroundColor: transparent ? 'transparent' : color }}
      className="w-full rounded flex items-center justify-center"
    >
      {label && (
        <span style={{ color: textColor, fontSize: 9, fontWeight: bold ? 700 : 400 }} className="text-center px-1 leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}

function WireInput({ label }: { label: string }) {
  return (
    <div className="space-y-0.5">
      <div style={{ fontSize: 8 }} className="text-gray-400">{label}</div>
      <div className="h-6 w-full border border-gray-300 rounded bg-white" />
    </div>
  );
}

function WireButton({
  label,
  primary = false,
  height = 28,
}: {
  label: string;
  primary?: boolean;
  height?: number;
}) {
  return (
    <div
      style={{ height, backgroundColor: primary ? '#6366f1' : 'white' }}
      className={`w-full rounded flex items-center justify-center ${primary ? '' : 'border border-gray-300'}`}
    >
      <span style={{ fontSize: 9, color: primary ? 'white' : '#4b5563', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function WireNavbar({ role = 'learner' }: { role?: 'learner' | 'instructor' }) {
  return (
    <div className="h-8 bg-white border-b border-gray-200 flex items-center px-2 gap-2 rounded-t">
      <span style={{ fontSize: 9, fontWeight: 900, color: '#4f46e5' }}>SV</span>
      <div className="flex-1" />
      <div className="h-3 bg-gray-200 rounded flex items-center justify-center px-1">
        <span style={{ fontSize: 7, color: '#9ca3af' }}>Catalogue</span>
      </div>
      {role === 'learner' && (
        <div className="h-3 bg-gray-200 rounded flex items-center justify-center px-1">
          <span style={{ fontSize: 7, color: '#9ca3af' }}>Dashboard</span>
        </div>
      )}
      {role === 'instructor' && (
        <div className="h-3 bg-gray-200 rounded flex items-center justify-center px-1">
          <span style={{ fontSize: 7, color: '#9ca3af' }}>Mes cours</span>
        </div>
      )}
      <div className="h-5 w-5 rounded-full bg-gray-200" />
    </div>
  );
}

function ScreenCard({
  title,
  url,
  badge,
  children,
}: {
  title: string;
  url: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex-shrink-0" style={{ width: 280 }}>
      {/* Browser chrome */}
      <div className="bg-gray-100 border-b border-gray-200 px-2 py-1.5">
        <div className="flex items-center gap-1 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
        </div>
        <div className="bg-white rounded border border-gray-200 px-1.5 py-0.5">
          <span style={{ fontSize: 7, color: '#9ca3af' }}>localhost:3001{url}</span>
        </div>
      </div>
      {/* Label bar */}
      <div className="bg-indigo-50 px-3 py-1.5 border-b border-indigo-100 flex items-center gap-2">
        <span style={{ fontSize: 9, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {badge && (
          <span className="bg-indigo-100 rounded px-1 py-0.5" style={{ fontSize: 7, color: '#6366f1' }}>{badge}</span>
        )}
      </div>
      {/* Content */}
      <div className="p-2 bg-gray-50 space-y-1.5" style={{ minHeight: 340 }}>
        {children}
      </div>
    </div>
  );
}

// ──── Flow diagram primitives ─────────────────────────────────────────────────

function FlowNode({
  label,
  sub,
  color = '#6366f1',
}: {
  label: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-center shadow-sm flex-shrink-0"
      style={{ backgroundColor: color, minWidth: 100 }}
    >
      <p className="text-white font-bold" style={{ fontSize: 11 }}>{label}</p>
      {sub && <p className="text-white opacity-60 mt-0.5" style={{ fontSize: 8 }}>{sub}</p>}
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ minWidth: 40 }}>
      {label && <span className="text-gray-400 mb-0.5" style={{ fontSize: 8 }}>{label}</span>}
      <span className="text-gray-300 font-bold" style={{ fontSize: 18 }}>→</span>
    </div>
  );
}

// ──── Screen Wireframes ───────────────────────────────────────────────────────

function ScreenLogin() {
  return (
    <ScreenCard title="Connexion" url="/auth/login" badge="Tous">
      <div className="flex flex-col items-center gap-1.5 pt-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <span className="text-white font-black" style={{ fontSize: 9 }}>SV</span>
        </div>
        <WireBox label="Se connecter" height={20} transparent textColor="#111827" bold />
        <WireBox label="Continuez votre apprentissage" height={16} transparent textColor="#9ca3af" />
      </div>
      <div className="space-y-1.5">
        <WireInput label="Adresse e-mail" />
        <WireInput label="Mot de passe" />
        <WireBox label="Mot de passe oublié ?" height={16} transparent textColor="#6366f1" />
        <WireButton label="Se connecter" primary />
        <div className="flex items-center gap-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400" style={{ fontSize: 8 }}>ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <WireButton label="Continuer avec Google" />
      </div>
      <WireBox label="Pas de compte ? S'inscrire →" height={20} transparent textColor="#6366f1" />
    </ScreenCard>
  );
}

function ScreenSignup() {
  return (
    <ScreenCard title="Inscription" url="/auth/signup" badge="Tous">
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
          <span className="text-white font-black" style={{ fontSize: 8 }}>SV</span>
        </div>
        <WireBox label="Créer un compte" height={18} transparent textColor="#111827" bold />
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-2 gap-1">
          <WireInput label="Prénom" />
          <WireInput label="Nom" />
        </div>
        <WireInput label="Adresse e-mail" />
        <WireInput label="Mot de passe" />
        <WireInput label="Confirmer le mot de passe" />
        <div>
          <div className="text-gray-400 mb-0.5" style={{ fontSize: 8 }}>Je suis un...</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-8 rounded border-2 border-indigo-500 bg-indigo-50 flex items-center justify-center">
              <span className="text-indigo-700 font-semibold" style={{ fontSize: 8 }}>Apprenant ✓</span>
            </div>
            <div className="h-8 rounded border border-gray-200 bg-white flex items-center justify-center">
              <span className="text-gray-400" style={{ fontSize: 8 }}>Formateur</span>
            </div>
          </div>
        </div>
        <WireButton label="Créer mon compte" primary />
      </div>
      <WireBox label="Déjà un compte ? Se connecter →" height={18} transparent textColor="#6366f1" />
    </ScreenCard>
  );
}

function ScreenCatalogue() {
  return (
    <ScreenCard title="Catalogue" url="/catalogue" badge="Apprenant">
      <WireNavbar />
      {/* Search */}
      <div className="h-7 bg-white border border-gray-200 rounded flex items-center px-2 gap-1">
        <span className="text-gray-300" style={{ fontSize: 10 }}>🔍</span>
        <span className="text-gray-300" style={{ fontSize: 8 }}>Rechercher un cours...</span>
      </div>
      {/* Filters */}
      <div className="flex gap-1">
        {['Catégorie ▾', 'Niveau ▾', 'Prix ▾', 'Trier ▾'].map((f) => (
          <div key={f} className="flex-1 h-5 bg-white border border-gray-200 rounded flex items-center justify-center">
            <span style={{ fontSize: 6.5, color: '#9ca3af' }}>{f}</span>
          </div>
        ))}
      </div>
      {/* Course grid */}
      <div className="grid grid-cols-2 gap-1">
        {[
          { from: '#6366f1', to: '#8b5cf6' },
          { from: '#3b82f6', to: '#6366f1' },
          { from: '#10b981', to: '#3b82f6' },
          { from: '#f59e0b', to: '#ef4444' },
        ].map((g, i) => (
          <div key={i} className="bg-white rounded border border-gray-100 p-1.5 space-y-1">
            <div
              className="h-10 rounded"
              style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
            />
            <div className="h-2 w-full bg-gray-200 rounded" />
            <div className="h-1.5 w-3/4 bg-gray-100 rounded" />
            <div className="flex justify-between items-center">
              <div className="h-2.5 w-8 bg-yellow-100 rounded" />
              <div className="h-2.5 w-8 bg-indigo-100 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-center gap-1 pt-0.5">
        {[1, 2, 3].map((p) => (
          <div
            key={p}
            className="h-5 w-5 rounded flex items-center justify-center"
            style={{ backgroundColor: p === 1 ? '#6366f1' : '#e5e7eb', color: p === 1 ? 'white' : '#6b7280', fontSize: 8 }}
          >
            {p}
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}

function ScreenCourseDetail() {
  return (
    <ScreenCard title="Détail Cours" url="/cours/[id]" badge="Apprenant">
      <WireNavbar />
      {/* Hero */}
      <div className="h-16 rounded p-2 flex flex-col justify-end" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
        <div className="h-2 w-24 rounded mb-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }} />
        <div className="h-1.5 w-16 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
      </div>
      {/* Stats */}
      <div className="flex gap-1">
        {['⭐ 4.8', '1240 élèves', '5h20', 'Inter.'].map((s) => (
          <div key={s} className="flex-1 h-5 bg-white border border-gray-100 rounded flex items-center justify-center">
            <span style={{ fontSize: 6.5, color: '#6b7280' }}>{s}</span>
          </div>
        ))}
      </div>
      {/* Two column */}
      <div className="flex gap-1.5">
        <div className="flex-1 space-y-1.5">
          <WireBox label="Ce que vous apprendrez" height={16} transparent textColor="#374151" bold />
          <div className="space-y-0.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-400 flex-shrink-0" />
                <div className="h-2 flex-1 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <WireBox label="Programme ▾" height={16} color="#f3f4f6" textColor="#6b7280" />
          <div className="space-y-0.5">
            {['Intro & env.', 'Async/Await', 'Modules ES', 'Proxies', 'Patterns'].map((ch) => (
              <div key={ch} className="h-5 bg-white border border-gray-100 rounded flex items-center px-1 gap-1">
                <div className="h-3 w-3 bg-indigo-100 rounded flex-shrink-0" />
                <span style={{ fontSize: 6.5, color: '#374151' }} className="flex-1 truncate">{ch}</span>
                <span style={{ fontSize: 6, color: '#9ca3af' }}>30m</span>
              </div>
            ))}
          </div>
        </div>
        {/* CTA card */}
        <div className="w-20 space-y-1">
          <div className="border border-gray-200 rounded p-1.5 space-y-1 bg-white">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-200 rounded flex items-center justify-center">
              <span style={{ fontSize: 8, color: '#374151', fontWeight: 700 }}>49€</span>
            </div>
            <WireButton label="S'inscrire" primary height={22} />
            <WireButton label="Aperçu" height={22} />
          </div>
        </div>
      </div>
    </ScreenCard>
  );
}

function ScreenChapter() {
  return (
    <ScreenCard title="Lecture Chapitre" url="/cours/[id]/chapitre/[ch]" badge="Apprenant">
      {/* Dark topbar */}
      <div className="h-7 rounded flex items-center px-2 gap-2" style={{ backgroundColor: '#1f2937' }}>
        <span style={{ fontSize: 7, color: '#9ca3af' }}>← JS Moderne</span>
        <div className="flex-1" />
        <span style={{ fontSize: 7, color: '#6b7280' }}>2/6</span>
        <div className="w-12 h-1 rounded-full" style={{ backgroundColor: '#374151' }}>
          <div className="w-1/3 h-1 rounded-full" style={{ backgroundColor: '#6366f1' }} />
        </div>
      </div>
      <div className="flex gap-1">
        {/* Sidebar */}
        <div className="space-y-0.5" style={{ width: 80 }}>
          <div style={{ fontSize: 7, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Chapitres</div>
          {[
            { label: 'Introduction', done: true, current: false },
            { label: 'Async/Await', done: false, current: true },
            { label: 'Modules ES', done: false, current: false },
            { label: 'Proxies', done: false, current: false },
          ].map((ch) => (
            <div
              key={ch.label}
              className="h-6 rounded px-1 flex items-center gap-1"
              style={{ backgroundColor: ch.current ? '#374151' : 'rgba(31,41,55,0.3)' }}
            >
              <div
                className="h-3 w-3 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: ch.done ? '#10b981' : ch.current ? '#6366f1' : '#4b5563' }}
              >
                {ch.done && <span className="text-white" style={{ fontSize: 6 }}>✓</span>}
              </div>
              <span style={{ fontSize: 6, color: '#d1d5db' }} className="leading-tight">{ch.label}</span>
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 space-y-1.5">
          {/* Video */}
          <div className="h-14 rounded flex items-center justify-center" style={{ backgroundColor: '#000' }}>
            <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <span className="text-white" style={{ fontSize: 8 }}>▶</span>
            </div>
          </div>
          <div className="h-2.5 w-24 bg-gray-200 rounded" />
          <div className="space-y-0.5">
            <div className="h-1.5 w-full bg-gray-200 rounded" />
            <div className="h-1.5 w-5/6 bg-gray-200 rounded" />
            <div className="h-1.5 w-4/5 bg-gray-200 rounded" />
            <div className="h-1.5 w-full bg-gray-200 rounded" />
          </div>
          {/* Quiz CTA */}
          <div className="h-8 border border-indigo-200 bg-indigo-50 rounded flex items-center px-1.5 gap-1.5">
            <div className="flex-1">
              <div className="h-1.5 w-12 bg-indigo-300 rounded mb-0.5" />
              <div className="h-1 w-16 bg-indigo-200 rounded" />
            </div>
            <div className="h-5 w-10 rounded flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
              <span className="text-white font-semibold" style={{ fontSize: 7 }}>Quiz →</span>
            </div>
          </div>
          {/* Navigation */}
          <div className="flex gap-1">
            <div className="flex-1 h-5 border border-gray-200 bg-white rounded flex items-center justify-center">
              <span style={{ fontSize: 7, color: '#6b7280' }}>← Préc.</span>
            </div>
            <div className="flex-1 h-5 rounded flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
              <span className="text-white font-semibold" style={{ fontSize: 7 }}>Suivant →</span>
            </div>
          </div>
        </div>
      </div>
    </ScreenCard>
  );
}

function ScreenQuiz() {
  return (
    <ScreenCard title="Quiz" url="/cours/[id]/quiz/[quizId]" badge="Apprenant">
      {/* Header */}
      <div className="h-8 bg-white border-b border-gray-200 flex items-center px-2 gap-2">
        <span style={{ fontSize: 9, color: '#9ca3af' }}>✕</span>
        <div className="flex-1">
          <div className="h-1.5 w-20 bg-gray-200 rounded mb-1" />
          <div className="h-1 w-full bg-gray-100 rounded overflow-hidden">
            <div className="h-1 w-1/2 rounded" style={{ backgroundColor: '#6366f1' }} />
          </div>
        </div>
        <span style={{ fontSize: 7, color: '#6b7280' }}>2/4</span>
      </div>
      {/* Question card */}
      <div className="bg-white rounded border border-gray-200 p-2 space-y-2">
        <span style={{ fontSize: 7, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase' }}>Question 2</span>
        <div className="space-y-0.5">
          <div className="h-1.5 w-full bg-gray-300 rounded" />
          <div className="h-1.5 w-3/4 bg-gray-300 rounded" />
        </div>
        {[
          { letter: 'A', text: "then()", selected: false },
          { letter: 'B', text: "await", selected: true },
          { letter: 'C', text: "resolve()", selected: false },
          { letter: 'D', text: "async()", selected: false },
        ].map((opt) => (
          <div
            key={opt.letter}
            className="h-7 rounded flex items-center px-1.5 gap-1"
            style={{
              border: opt.selected ? '2px solid #6366f1' : '1px solid #e5e7eb',
              backgroundColor: opt.selected ? '#eef2ff' : 'white',
            }}
          >
            <div
              className="h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: opt.selected ? '#6366f1' : '#f3f4f6' }}
            >
              <span style={{ fontSize: 6, fontWeight: 700, color: opt.selected ? 'white' : '#6b7280' }}>{opt.letter}</span>
            </div>
            <span style={{ fontSize: 7.5, color: '#374151' }}>{opt.text}</span>
          </div>
        ))}
      </div>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-14 border border-gray-200 rounded flex items-center justify-center">
          <span style={{ fontSize: 7, color: '#6b7280' }}>← Préc.</span>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === 2 ? 16 : 6,
                backgroundColor: i === 2 ? '#6366f1' : i < 2 ? '#a5b4fc' : '#d1d5db',
              }}
            />
          ))}
        </div>
        <div className="h-6 w-14 rounded flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
          <span className="text-white font-semibold" style={{ fontSize: 7 }}>Suivant →</span>
        </div>
      </div>
      {/* Results preview */}
      <div className="border-t border-gray-100 pt-1.5 space-y-1">
        <span style={{ fontSize: 8, color: '#9ca3af' }}>Résultats (après soumission)</span>
        <div className="bg-white border border-gray-200 rounded p-1.5 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span style={{ fontSize: 8, color: '#16a34a', fontWeight: 700 }}>75%</span>
          </div>
          <div className="space-y-0.5">
            <div className="h-2 w-16 bg-gray-200 rounded" />
            <div className="h-1.5 w-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </ScreenCard>
  );
}

function ScreenDashboard() {
  return (
    <ScreenCard title="Dashboard Progression" url="/dashboard" badge="Apprenant">
      <WireNavbar role="learner" />
      {/* Stats */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { icon: '📚', value: '2', label: 'En cours' },
          { icon: '✅', value: '1', label: 'Terminé' },
          { icon: '📖', value: '8', label: 'Chapitres' },
          { icon: '🏆', value: '75%', label: 'Quiz' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded border border-gray-200 p-1 text-center space-y-0.5">
            <div style={{ fontSize: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#111827' }}>{s.value}</div>
            <div style={{ fontSize: 6.5, color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* In progress */}
      <WireBox label="Cours en cours" height={16} transparent textColor="#374151" bold />
      <div className="space-y-1">
        {[
          { title: 'JavaScript Moderne', progress: 33 },
          { title: 'React & TypeScript', progress: 25 },
        ].map((course) => (
          <div key={course.title} className="bg-white rounded border border-gray-200 p-1.5 space-y-1">
            <div className="flex justify-between">
              <div className="h-2 w-20 bg-gray-300 rounded" />
              <span style={{ fontSize: 7, color: '#6366f1' }}>{course.progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded overflow-hidden">
              <div className="h-1.5 rounded" style={{ width: `${course.progress}%`, backgroundColor: '#6366f1' }} />
            </div>
            <WireButton label="Continuer →" primary height={20} />
          </div>
        ))}
      </div>
      {/* Activity */}
      <WireBox label="Activité récente" height={16} transparent textColor="#374151" bold />
      <div className="space-y-0.5">
        {['Quiz JS — 75% ✅', 'Chapitre 2 terminé', 'Inscrit à React & TS'].map((a) => (
          <div key={a} className="h-5 bg-white border border-gray-100 rounded flex items-center px-1.5">
            <span style={{ fontSize: 7, color: '#6b7280' }}>{a}</span>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}

function ScreenFormateur() {
  return (
    <ScreenCard title="Espace Formateur" url="/formateur" badge="Formateur">
      <WireNavbar role="instructor" />
      {/* Stats */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { icon: '📦', value: '3', label: 'Cours' },
          { icon: '🌿', value: '2', label: 'Publiés' },
          { icon: '👥', value: '2116', label: 'Élèves' },
          { icon: '⭐', value: '4.8', label: 'Note' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded border border-gray-200 p-1 text-center space-y-0.5">
            <div style={{ fontSize: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#111827' }}>{s.value}</div>
            <div style={{ fontSize: 6.5, color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Courses table */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <WireBox label="Mes cours" height={16} transparent textColor="#374151" bold />
          <div className="h-5 w-14 rounded flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
            <span className="text-white" style={{ fontSize: 7 }}>+ Nouveau</span>
          </div>
        </div>
        {/* Table header */}
        <div className="grid gap-0.5 px-1" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
          {['Titre', 'Statut', 'Élèves', 'Note', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: 6, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {/* Table rows */}
        {[
          { title: 'JS Moderne', status: '🟢', students: '1240', note: '4.8' },
          { title: 'React & TS', status: '🟢', students: '876', note: '4.9' },
          { title: 'DevOps', status: '🟡', students: '0', note: '—' },
        ].map((row) => (
          <div
            key={row.title}
            className="grid items-center bg-white border border-gray-100 rounded px-1 py-0.5 gap-0.5"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}
          >
            <span style={{ fontSize: 6.5, color: '#374151' }} className="truncate">{row.title}</span>
            <span style={{ fontSize: 8 }}>{row.status}</span>
            <span style={{ fontSize: 6.5, color: '#6b7280' }}>{row.students}</span>
            <span style={{ fontSize: 6.5, color: '#6b7280' }}>{row.note}</span>
            <div className="flex gap-0.5">
              <div className="h-3 w-5 bg-indigo-100 rounded" />
              <div className="h-3 w-5 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}

function ScreenCourseEditor() {
  return (
    <ScreenCard title="Éditeur Cours" url="/formateur/cours/[id]" badge="Formateur">
      {/* Sticky topbar */}
      <div className="h-8 bg-white border-b border-gray-200 flex items-center px-2 gap-1.5">
        <span style={{ fontSize: 9, color: '#9ca3af' }}>←</span>
        <span style={{ fontSize: 8, fontWeight: 600, color: '#374151' }} className="flex-1">JS Moderne</span>
        <div className="h-5 w-10 border border-gray-200 rounded flex items-center justify-center">
          <span style={{ fontSize: 7, color: '#6b7280' }}>Aperçu</span>
        </div>
        <div className="h-5 w-12 rounded flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
          <span className="text-white font-semibold" style={{ fontSize: 7 }}>Sauver</span>
        </div>
        <div className="h-5 w-12 rounded flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
          <span className="text-white font-semibold" style={{ fontSize: 7 }}>Publier</span>
        </div>
      </div>
      {/* Two column */}
      <div className="flex gap-1.5">
        {/* Left — main */}
        <div className="flex-1 space-y-1.5">
          {/* Info card */}
          <div className="bg-white border border-gray-200 rounded p-1.5 space-y-1">
            <WireBox label="Informations générales" height={14} transparent textColor="#374151" bold />
            <WireInput label="Titre *" />
            <div>
              <div className="text-gray-400 mb-0.5" style={{ fontSize: 8 }}>Description *</div>
              <div className="h-8 w-full border border-gray-300 rounded bg-white" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {['Catégorie', 'Niveau', 'Prix (€)'].map((f) => (
                <div key={f}>
                  <div className="text-gray-400 mb-0.5" style={{ fontSize: 7 }}>{f}</div>
                  <div className="h-5 border border-gray-300 rounded bg-white" />
                </div>
              ))}
            </div>
            <div className="h-8 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
              <span style={{ fontSize: 7, color: '#9ca3af' }}>+ Image de couverture</span>
            </div>
          </div>
          {/* Chapters */}
          <div className="bg-white border border-gray-200 rounded p-1.5 space-y-1">
            <div className="flex items-center justify-between">
              <WireBox label="Chapitres (6)" height={14} transparent textColor="#374151" bold />
              <div className="h-4 w-16 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                <span style={{ fontSize: 6.5, color: '#6b7280' }}>+ Chapitre</span>
              </div>
            </div>
            {['Intro & env.', 'Async/Await', 'Modules ES'].map((ch) => (
              <div key={ch} className="h-6 border border-gray-200 rounded flex items-center px-1 gap-1">
                <div className="h-3 w-3 bg-gray-200 rounded flex-shrink-0" />
                <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span style={{ fontSize: 6, color: '#6366f1' }}>1</span>
                </div>
                <span style={{ fontSize: 7, color: '#374151' }} className="flex-1 truncate">{ch}</span>
                <span style={{ fontSize: 8, color: '#9ca3af' }}>⌄</span>
              </div>
            ))}
          </div>
        </div>
        {/* Right — sidebar */}
        <div style={{ width: 76 }} className="space-y-1.5">
          {/* Publish checklist */}
          <div className="bg-white border border-gray-200 rounded p-1.5 space-y-1">
            <WireBox label="Publication" height={14} transparent textColor="#374151" bold />
            {[
              { label: 'Titre', done: true },
              { label: 'Description', done: true },
              { label: 'Image', done: false },
              { label: '1 chapitre', done: true },
              { label: 'Quiz final', done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-0.5">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: item.done ? '#16a34a' : '#e5e7eb' }}
                >
                  {item.done && <span className="text-white" style={{ fontSize: 6 }}>✓</span>}
                </div>
                <span style={{ fontSize: 6.5, color: item.done ? '#374151' : '#9ca3af' }}>{item.label}</span>
              </div>
            ))}
            <WireButton label="Publier" primary height={22} />
          </div>
          {/* Danger zone */}
          <div className="bg-white border border-red-100 rounded p-1.5 space-y-1">
            <WireBox label="Zone danger" height={14} transparent textColor="#374151" bold />
            <div className="h-5 border border-orange-200 rounded flex items-center justify-center">
              <span style={{ fontSize: 6.5, color: '#c2410c' }}>Archiver</span>
            </div>
            <div className="h-5 border border-red-200 rounded flex items-center justify-center">
              <span style={{ fontSize: 6.5, color: '#dc2626' }}>Supprimer</span>
            </div>
          </div>
        </div>
      </div>
    </ScreenCard>
  );
}

// ──── Main Page ───────────────────────────────────────────────────────────────

const SCREENS = [
  { label: 'Connexion', href: '/auth/login' },
  { label: 'Inscription', href: '/auth/signup' },
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Détail cours', href: '/cours/c1' },
  { label: 'Chapitre', href: '/cours/c1/chapitre/ch1' },
  { label: 'Quiz', href: '/cours/c1/quiz/q1' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Formateur', href: '/formateur' },
  { label: 'Éditeur', href: '/formateur/cours/c1' },
];

const INVENTORY = [
  { n: '01', screen: 'Connexion', route: '/auth/login', role: 'Tous', features: 'Email/mot de passe · SSO Google · Lien inscription' },
  { n: '02', screen: 'Inscription', route: '/auth/signup', role: 'Tous', features: 'Formulaire · Sélection rôle Apprenant/Formateur · Validation' },
  { n: '03', screen: 'Catalogue', route: '/catalogue', role: 'Apprenant', features: 'Recherche · Filtres (catégorie, niveau, prix) · Grille · Pagination' },
  { n: '04', screen: 'Détail Cours', route: '/cours/[id]', role: 'Apprenant', features: 'Hero · Programme chapitres · Profil formateur · CTA inscription' },
  { n: '05', screen: 'Lecture Chapitre', route: '/cours/[id]/chapitre/[ch]', role: 'Apprenant', features: 'Lecteur vidéo · Contenu markdown · Sidebar progrès · Prev/Next' },
  { n: '06', screen: 'Quiz', route: '/cours/[id]/quiz/[q]', role: 'Apprenant', features: 'Question/réponse · 4 options · Score 70% requis · Correction détaillée' },
  { n: '07', screen: 'Dashboard', route: '/dashboard', role: 'Apprenant', features: 'Stats · Cours en cours + barres progrès · Fil d\'activité récente' },
  { n: '08', screen: 'Espace Formateur', route: '/formateur', role: 'Formateur', features: 'Stats · Table des cours · Statuts · Actions rapides · Nouveau cours' },
  { n: '09', screen: 'Éditeur Cours', route: '/formateur/cours/[id]', role: 'Formateur', features: 'Infos cours · Chapitres (drag & drop) · Upload image · Checklist publication' },
];

export default function WireframesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-indigo-600 font-black text-lg">ScriptVerse</span>
            <span className="h-5 w-px bg-gray-200" />
            <span className="text-sm font-semibold text-gray-700">Maquettes MVP</span>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              Basse fidélité
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>9 écrans</span>
            <span>·</span>
            <span>2 flux utilisateurs</span>
            <span>·</span>
            <span>Next.js App Router</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-14">
        {/* ── Intro ── */}
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wireframes & Flux — MVP ScriptVerse</h1>
            <p className="text-gray-500 mt-1 max-w-2xl">
              Maquettes basse-fidélité des 9 écrans MVP de la plateforme de formation.
              Deux parcours : <strong className="text-gray-700">Apprenant</strong> (découverte → apprentissage → progression)
              et <strong className="text-gray-700">Formateur</strong> (création → publication).
            </p>
          </div>
          {/* Quick links to live pages */}
          <div className="flex flex-wrap gap-2">
            {SCREENS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {s.label}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ))}
          </div>
        </section>

        {/* ── User Flows ── */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            Flux Utilisateurs
          </h2>

          {/* Apprenant flow */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Parcours Apprenant</h3>
                <p className="text-xs text-gray-400">Découverte → Inscription → Apprentissage → Évaluation → Suivi</p>
              </div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-1 min-w-max">
                {/* Auth group */}
                <div className="flex flex-col gap-1">
                  <FlowNode label="Connexion" sub="/auth/login" color="#6366f1" />
                  <FlowNode label="Inscription" sub="/auth/signup" color="#818cf8" />
                </div>
                <Arrow />
                <FlowNode label="Catalogue" sub="/catalogue" color="#7c3aed" />
                <Arrow />
                <FlowNode label="Détail Cours" sub="/cours/[id]" color="#9333ea" />
                <Arrow label="Inscription cours" />
                <FlowNode label="Lecture Chapitre" sub="/cours/[id]/chapitre/[ch]" color="#1d4ed8" />
                <Arrow label="Quiz dispo" />
                <FlowNode label="Quiz" sub="/cours/[id]/quiz/[q]" color="#d97706" />
                <Arrow label="Terminé" />
                <FlowNode label="Dashboard" sub="/dashboard" color="#059669" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: '#6366f1' }} />
                Authentification
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: '#7c3aed' }} />
                Découverte
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: '#1d4ed8' }} />
                Apprentissage
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: '#d97706' }} />
                Évaluation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: '#059669' }} />
                Progression
              </span>
            </div>
          </div>

          {/* Formateur flow */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">F</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Parcours Formateur</h3>
                <p className="text-xs text-gray-400">Inscription → Création cours → Édition chapitres → Publication</p>
              </div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center gap-1 min-w-max">
                <div className="flex flex-col gap-1">
                  <FlowNode label="Connexion" sub="/auth/login" color="#6366f1" />
                  <FlowNode label="Inscription (Formateur)" sub="/auth/signup" color="#818cf8" />
                </div>
                <Arrow />
                <FlowNode label="Espace Formateur" sub="/formateur" color="#ea580c" />
                <Arrow label="Créer / éditer" />
                <FlowNode label="Éditeur Cours" sub="/formateur/cours/[id]" color="#dc2626" />
                <Arrow label="Publier" />
                <FlowNode label="Cours en ligne" sub="/cours/[id]" color="#059669" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Wireframes Grid ── */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            Wireframes — 9 Écrans MVP
          </h2>
          <p className="text-sm text-gray-400 -mt-2">Maquettes basse-fidélité à ~280 px de large. Cliquez les liens ci-dessus pour accéder aux implémentations réelles.</p>

          <div className="flex flex-wrap gap-6">
            <ScreenLogin />
            <ScreenSignup />
            <ScreenCatalogue />
            <ScreenCourseDetail />
            <ScreenChapter />
            <ScreenQuiz />
            <ScreenDashboard />
            <ScreenFormateur />
            <ScreenCourseEditor />
          </div>
        </section>

        {/* ── Inventory table ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">3</span>
            Inventaire des Écrans
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['#', 'Écran', 'Route', 'Rôle', 'Fonctionnalités clés'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {INVENTORY.map((row) => (
                  <tr key={row.n} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{row.n}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.screen}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                        {row.route}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.role === 'Tous'
                            ? 'bg-gray-100 text-gray-600'
                            : row.role === 'Apprenant'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 pb-4">
          <p className="text-xs text-gray-400 text-center">
            ScriptVerse MVP · {INVENTORY.length} écrans · Next.js 14 + Tailwind CSS · Toutes les pages sont implémentées avec données fictives
          </p>
        </footer>
      </main>
    </div>
  );
}
