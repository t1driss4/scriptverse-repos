# Journal de développement — Scriptverse

---

## 2026-04-22 — Ticket 21be4: "Front: Auth pages + routing"

### Résumé

Connexion des pages d'authentification à l'API réelle : remplacement des formulaires mock par une couche API typée, un contexte React gérant l'état d'authentification (avec refresh silencieux), et des composants UI réutilisables. Côté API, ajout du CORS et du `ValidationPipe` global.

### Ce qui a été implémenté

**Couche API (`apps/web/src/lib/api.ts`)**
- Wrapper `request<T>` générique autour de `fetch` : gestion des codes d'erreur HTTP, extraction du message NestJS (`body.message`), support du statut 204
- `authApi` exposant cinq endpoints typés : `signup`, `login`, `refresh`, `logout`, `resetPassword`

**Gestion des tokens (`apps/web/src/lib/auth-storage.ts`)**
- Helpers `localStorage` pour les tokens JWT (`sv_access_token` / `sv_refresh_token`)
- Décodage JWT client-side sans dépendance externe (`decodeJwt` + `isTokenExpired`)

**AuthContext (`apps/web/src/contexts/AuthContext.tsx`)**
- `AuthProvider` wrappant toute l'application (enregistré dans `layout.tsx`)
- Hydratation au montage : accès token valide → état user immédiat ; token expiré → refresh silencieux via `authApi.refresh` ; refresh impossible → tokens effacés
- Actions exposées : `login`, `signup`, `logout` — chacune met à jour tokens et état user atomiquement
- Hook `useAuth()` avec guard d'utilisation hors provider

**Pages d'authentification**
- `/auth/login` — validation inline (email + mot de passe requis, format email), redirection post-login selon le rôle (`FORMATEUR` → `/formateur`, autre → `/dashboard`), bouton Google SSO désactivé (placeholder "bientôt disponible")
- `/auth/signup` — validation (email, mot de passe ≥ 8 caractères, confirmation), sélecteur de rôle visuel (cartes radio Apprenant / Formateur), case CGU obligatoire avant soumission
- `/auth/reset-password` — envoi de l'email de réinitialisation via `authApi.resetPassword`, affichage d'un état de succès (remplacement du formulaire) après soumission

**Composants UI (`apps/web/src/components/ui/`)**
- `<Button>` — `forwardRef`, variantes `primary` / `secondary`, prop `loading` avec spinner SVG animé, `fullWidth` par défaut
- `<Input>` — `forwardRef`, `label` associé par `htmlFor`, état d'erreur (bordure rouge + message), attributs ARIA (`aria-invalid`, `aria-describedby`)

**API NestJS (`apps/api/src/main.ts`)**
- CORS activé avec `origin` configurable via `FRONTEND_URL` (défaut `http://localhost:3001`) et `credentials: true`
- `ValidationPipe` global : `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`

### Alignement design

Aucune maquette spécifique fournie pour ce ticket (DESIGN_SPECS.md vide). L'implémentation s'appuie sur les classes utilitaires Tailwind établies au ticket 334f8 (`card`, `btn-primary`, `btn-secondary`, `input`, palette `primary-*`), garantissant une cohérence visuelle avec les wireframes existants. Les formulaires suivent le même layout centré (max-w-md, fond `gray-50`) que les maquettes MVP.

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/web/src/lib/api.ts` | Client HTTP typé pour tous les endpoints auth |
| `apps/web/src/lib/auth-storage.ts` | Helpers JWT / localStorage |
| `apps/web/src/contexts/AuthContext.tsx` | État auth global + refresh silencieux |
| `apps/web/src/app/layout.tsx` | Enregistrement de `AuthProvider` à la racine |
| `apps/web/src/app/auth/login/page.tsx` | Page de connexion avec validation et redirection par rôle |
| `apps/web/src/app/auth/signup/page.tsx` | Page d'inscription avec sélecteur de rôle visuel |
| `apps/web/src/app/auth/reset-password/page.tsx` | Demande de réinitialisation avec état de succès |
| `apps/web/src/components/ui/Button.tsx` | Composant bouton réutilisable (loading, variantes) |
| `apps/web/src/components/ui/Input.tsx` | Composant champ de saisie (label, erreur, ARIA) |
| `apps/api/src/main.ts` | CORS + ValidationPipe global |

### Notes

- Le refresh silencieux au montage évite toute déconnexion intempestive lors d'un rechargement de page après expiration du token d'accès.
- Le décodage JWT est fait côté client sans librairie externe ; le payload n'est pas vérifié cryptographiquement (le serveur reste la source de vérité).
- Le ticket suivant pourra s'appuyer sur `useAuth()` et `authApi` pour protéger les routes privées (middleware / guard côté Next.js).

---

## 2026-04-22 — Ticket 9c6f4: "Setup repo + monorepo"

### Résumé

Restructuration complète du dépôt en monorepo pnpm workspaces, avec séparation claire entre le frontend (`apps/web`) et le backend (`apps/api`), ajout de packages partagés, et mise en place de l'outillage qualité (Husky, Commitlint, Prettier).

### Ce qui a été implémenté

**Structure monorepo**
- Migration de la disposition à plat vers **pnpm workspaces** avec deux applications : `apps/web` (Next.js) et `apps/api` (NestJS)
- Création de `pnpm-workspace.yaml` et mise à jour du `package.json` racine en conséquence
- Suppression des anciens `package-lock.json` (racine et `frontend/`) et génération du `pnpm-lock.yaml` unifié
- Déplacement du schéma Prisma vers `apps/api/prisma/schema.prisma`

**Packages partagés**
- `packages/tsconfig` — configurations TypeScript de base, NestJS et Next.js (`base.json`, `nestjs.json`, `nextjs.json`)
- `packages/eslint-config` — règles ESLint mutualisées pour Next.js et NestJS
- `packages/prettier-config` — configuration Prettier partagée entre les deux apps

**Outillage qualité**
- **Husky** + **Commitlint** : enforcement des Conventional Commits à chaque `git commit`, avec support du type `auto` (utilisé par les agents)
- `.prettierrc.js` et `.prettierignore` ajoutés à la racine

**Nettoyage et documentation**
- `.gitignore` étendu : exclusion des artefacts de build `.next/` précédemment suivis (suppression de ~200 fichiers de cache webpack/static)
- `.env.example` ajouté pour documenter les variables d'environnement requises
- `README.md` entièrement réécrit avec instructions de setup, structure du monorepo et commandes utiles

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `pnpm-workspace.yaml` | Déclaration des workspaces pnpm |
| `packages/tsconfig/` | Configs TypeScript partagées |
| `packages/eslint-config/` | Règles ESLint mutualisées |
| `packages/prettier-config/` | Config Prettier partagée |
| `.commitlintrc.js` | Règles Commitlint (Conventional Commits + type `auto`) |
| `.husky/commit-msg` | Hook git qui déclenche Commitlint |
| `apps/api/prisma/schema.prisma` | Schéma Prisma déplacé dans l'app API |

### Notes

- Aucune logique métier modifiée : ce ticket est purement infrastructurel.
- Le ticket suivant pourra s'appuyer sur la config partagée (`tsconfig`, `eslint-config`) pour unifier la qualité de code entre `apps/web` et `apps/api`.

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
