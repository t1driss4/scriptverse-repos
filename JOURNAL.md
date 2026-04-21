# Journal de développement — Scriptverse

---

## 2026-04-21 — Ticket 334f8: "Maquettes rapides (MVP)"

### Résumé

Mise en place complète du frontend Next.js (MVP) avec des données fictives, couvrant l'ensemble des parcours utilisateur de la plateforme e-learning.

### Ce qui a été implémenté

**Infrastructure frontend**
- Initialisation du projet Next.js avec TypeScript, Tailwind CSS et PostCSS
- Configuration Tailwind avec palette `primary` personnalisée (correction des nuances 300/400/900 manquantes qui causaient des lacunes CSS silencieuses dans les indicateurs de quiz, les vignettes de cours et les textes d'aide formateur)
- Système de types TypeScript (`src/lib/types.ts`) : `User`, `Course`, `Chapter`, `Quiz`, `Enrollment`, `QuizAttempt`
- Données mock complètes (`src/lib/mock-data.ts`) avec cours, chapitres, quiz et utilisateurs de test

**Pages apprenant**
- `/` — page d'accueil (redirect)
- `/auth/login` et `/auth/signup` — formulaires d'authentification
- `/catalogue` — liste des cours avec filtres par niveau et catégorie, barre de recherche
- `/cours/[id]` — fiche détaillée d'un cours (description, chapitres, progression)
- `/cours/[id]/chapitre/[chapitreId]` — lecteur de chapitre avec navigation précédent/suivant et marquage de complétion
- `/cours/[id]/quiz/[quizId]` — quiz interactif avec score final et révision des réponses
- `/dashboard` — tableau de bord apprenant (cours en cours, progression, statistiques)

**Pages formateur**
- `/formateur` — tableau de bord formateur (liste des cours, revenus, inscriptions)
- `/formateur/cours/[id]` — éditeur de cours (chapitres, quiz, statut de publication)

**Composants partagés**
- `<CourseCard>` — carte de cours réutilisable (thumbnail, rating, prix, niveau)
- `<Navbar>` — barre de navigation avec rôle utilisateur

**Page de wireframes**
- `/wireframes` — page de référence regroupant tous les composants UI sur une seule page (usage interne / design review)

**Schéma Prisma étendu**
- Nouveaux modèles : `Course`, `Chapter`, `Quiz`, `QuizQuestion`, `Enrollment`, `ChapterProgress`, `QuizAttempt`
- Relations complètes entre `User` ↔ `Course` ↔ `Chapter` ↔ `Quiz` ↔ `QuizAttempt`

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `frontend/src/lib/types.ts` | Types TypeScript partagés |
| `frontend/src/lib/mock-data.ts` | Données fictives pour le MVP |
| `frontend/tailwind.config.ts` | Palette Tailwind avec `primary` custom |
| `frontend/src/app/wireframes/page.tsx` | Référence UI complète |
| `prisma/schema.prisma` | Schéma DB étendu avec tous les modèles métier |

### Notes

- Toutes les pages fonctionnent avec des données mock ; aucune intégration API réelle dans ce ticket.
- Le ticket suivant devra brancher ces pages sur les endpoints d'auth et de cours existants.
