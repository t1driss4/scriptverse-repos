# Journal de développement — Scriptverse

---

## 2026-04-24 — Ticket 4594d: "Fix TS2564 sur DTO (email/password)"

### Résumé

Correction de l'erreur TypeScript **TS2564** (`Property has no initializer and is not definitely assigned in the constructor`) sur les trois DTO d'authentification. L'ajout de l'opérateur `!` (*definite assignment assertion*) aligne les classes DTO avec `strictPropertyInitialization: true` tout en conservant le comportement de validation `class-validator`. Le ticket inclut aussi la mise en place de la configuration Jest pour l'API et la rédaction de tests unitaires complets sur ces DTO. En marge, quelques primitives d'animation et un état de chargement squelette ont été ajoutés côté frontend.

### Architecture

**Cause racine de TS2564**

Avec `strictPropertyInitialization` activé (hérité du `tsconfig` NestJS), TypeScript exige que chaque propriété de classe soit soit initialisée dans la déclaration, soit marquée comme optionnelle (`?`), soit déclarée avec l'assertion `!`. Les DTO de `class-validator` utilisent des décorateurs pour décrire la validation mais ne fournissent pas de valeur par défaut — le compilateur ne peut donc pas prouver l'initialisation, d'où TS2564.

**Solution retenue : `!` (definite assignment assertion)**

L'alternative `?: string` aurait rendu les champs optionnels au sens TypeScript, en contradiction avec les règles de validation (`@IsEmail()` / `@IsString()`) qui lèvent une erreur si le champ est absent. Le `!` indique au compilateur que la valeur sera fournie par le mécanisme de transformation (`plainToInstance`) sans assouplir le contrat métier.

**Exécution des tests DTO**

Le `ValidationPipe` de NestJS transforme les corps de requête à l'exécution ; les tests unitaires reproduisent ce pipeline manuellement avec `plainToInstance` (class-transformer) + `validate` (class-validator), ce qui permet de tester les règles sans démarrer le serveur NestJS. Le fichier `jest.config.ts` utilise `ts-jest` pour transpiler TypeScript à la volée.

### Ce qui a été implémenté

**Correction TS2564 — trois DTO (`apps/api/src/auth/dto/`)**

| DTO | Propriétés corrigées |
|---|---|
| `LoginDto` | `email!: string`, `password!: string` |
| `SignupDto` | `email!: string`, `password!: string` (`role?: Role` inchangé — déjà optionnel) |
| `ResetPasswordDto` | `email!: string` |

**Configuration Jest (`apps/api/jest.config.ts`)**
- Preset `ts-jest`, environnement `node`
- Alias `@/` → `<rootDir>/src/` (cohérence avec le `tsconfig` API)
- Pattern de détection : `**/*.spec.ts`

**Correctif `reflect-metadata` (`apps/api/src/main.ts`)**
- Ajout de `import 'reflect-metadata'` en tête de fichier — requis pour que les décorateurs `class-transformer`/`class-validator` s'enregistrent correctement au démarrage

**Tests unitaires DTO**

*`login.dto.spec.ts`* — 7 cas :
- Email valide → 0 erreur
- Email non conforme → erreur `isEmail`
- Email absent → erreur sur `email`
- Mot de passe de 8 caractères exactement → valide
- Mot de passe > 8 caractères → valide
- Mot de passe < 8 caractères → erreur `minLength`
- Mot de passe non-string → erreur `isString`
- Mot de passe absent → erreur sur `password`

*`signup.dto.spec.ts`* — 9 cas :
- Paires email/password valides → 0 erreur
- Email invalide → erreur `isEmail`
- Email absent → erreur sur `email`
- Mot de passe 8 caractères → valide
- Mot de passe court → erreur `minLength`
- Mot de passe non-string → erreur `isString`
- Mot de passe absent → erreur sur `password`
- `role` enum valide (tous les membres de `Role`) → valide
- `role` invalide (`'SUPERADMIN'`) → erreur `isEnum`
- `role` absent → valide (champ optionnel)

*`reset-password.dto.spec.ts`* — 5 cas :
- Email valide → 0 erreur
- Email avec sous-domaine → valide
- Email invalide → erreur `isEmail`
- Email sans domaine (`user@`) → erreur `isEmail`
- Email absent → erreur sur `email`

**Animations frontend (`apps/web/src/components/animations/`)**
- `FadeIn.tsx` — composant `framer-motion` avec direction configurable (`up`/`down`/`left`/`right`/`none`), délai et durée en props
- `StaggerCards.tsx` + `StaggerItem` — container/enfant avec stagger de 70 ms entre cartes (curve ease cubique)

**Squelette de chargement catalogue (`apps/web/src/app/catalogue/`)**
- `loading.tsx` — page de chargement Next.js (Suspense streaming) : hero skeleton, sidebar à 9 placeholders, grille 2×3 de `SkeletonCard`
- `SkeletonCard.tsx` — carte squelette reproduisant la structure de `CourseCard` (thumbnail + 5 lignes de texte + footer)

### Statut des tests

| Suite | Cas | Statut |
|---|---|---|
| `login.dto.spec.ts` | 8 | Écrits, non exécutés en CI |
| `signup.dto.spec.ts` | 9 | Écrits, non exécutés en CI |
| `reset-password.dto.spec.ts` | 5 | Écrits, non exécutés en CI |

> La configuration Jest est en place (`ts-jest` + `reflect-metadata`). Les tests peuvent être lancés localement avec `pnpm --filter api test`. L'intégration CI reste à configurer (étape suivante).

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/api/src/auth/dto/login.dto.ts` | Fix `!` sur `email` et `password` |
| `apps/api/src/auth/dto/signup.dto.ts` | Fix `!` sur `email` et `password` |
| `apps/api/src/auth/dto/reset-password.dto.ts` | Fix `!` sur `email` |
| `apps/api/jest.config.ts` | Configuration Jest avec `ts-jest` |
| `apps/api/src/main.ts` | Ajout de `import 'reflect-metadata'` |
| `apps/api/src/auth/dto/login.dto.spec.ts` | Tests unitaires `LoginDto` |
| `apps/api/src/auth/dto/signup.dto.spec.ts` | Tests unitaires `SignupDto` |
| `apps/api/src/auth/dto/reset-password.dto.spec.ts` | Tests unitaires `ResetPasswordDto` |
| `apps/web/src/components/animations/FadeIn.tsx` | Composant animation fade directionnel |
| `apps/web/src/components/animations/StaggerCards.tsx` | Composant animation stagger pour grilles |
| `apps/web/src/components/ui/SkeletonCard.tsx` | Carte squelette pour le catalogue |
| `apps/web/src/app/catalogue/loading.tsx` | État de chargement Next.js (Suspense) |

### Notes

- L'opérateur `!` est la correction minimale et sémantiquement correcte pour les DTO `class-validator` : ne pas utiliser `= ''` (valeur par défaut trompeuse) ni `?: string` (briserait la validation obligatoire).
- `plainToInstance` dans les specs simule exactement ce que fait le `ValidationPipe` de NestJS (`transform: true`) — les tests sont donc fidèles au comportement en production.
- En v2 : brancher les tests DTO sur la CI GitHub Actions (job `test:unit` dans `.github/workflows/`) ; envisager `class-transformer` strict mode pour les DTOs sensibles.

---

## 2026-04-22 — Ticket d8ca9: "Modèle Cours (Course/Module/Lesson) + endpoints CRUD (v1)"

### Résumé

Mise en place de la hiérarchie à trois niveaux **Course > Module > Lesson** : refonte du schéma Prisma (remplacement de `Chapter` par `Module`/`Lesson`, abandon de l'enum `CourseStatus` au profit d'un booléen `published`), création de trois modules NestJS CRUD avec contrôle d'accès par rôle, et alignement du client TypeScript frontend (types + API client) sur le nouveau contrat.

### Ce qui a été implémenté

**Schéma Prisma (`apps/api/prisma/schema.prisma`)**
- Suppression de l'enum `CourseStatus` (`DRAFT` / `PUBLISHED` / `ARCHIVED`) → remplacement par `published Boolean @default(false)` directement sur `Course` (simplification : deux états suffisent pour la v1)
- Ajout de l'enum `LessonType` (`VIDEO`) — extensible en v2 (PDF, QUIZ…)
- Renommage de `Chapter` → `Module` (champs simplifiés : `id`, `title`, `order`, `courseId` — suppression de `content`, `videoUrl`, `duration` qui n'appartiennent pas au conteneur)
- Nouveau modèle `Lesson` : `id`, `title`, `type LessonType`, `url?`, `order`, `moduleId` — unité de contenu réelle
- Renommage de `ChapterProgress` → `ModuleProgress` (cohérence avec la nouvelle terminologie)
- `Quiz` mis à jour pour référencer `moduleId` au lieu de `chapterId`
- Nom de migration : `course_module_lesson_v1`

**API NestJS — trois modules**
- `CoursesModule` (`/courses`) — CRUD complet : `POST /courses` (FORMATEUR), `GET /courses` (public), `GET /courses/mine` (FORMATEUR), `GET /courses/:id`, `PATCH /courses/:id`, `DELETE /courses/:id`
- `ModulesModule` (préfixe `''`) — routes nested + standalone : `POST/GET /courses/:courseId/modules`, `GET/PATCH/DELETE /modules/:id`
- `LessonsModule` (préfixe `''`) — même pattern : `POST/GET /modules/:moduleId/lessons`, `GET/PATCH/DELETE /lessons/:id`
- Les contrôleurs `ModulesController` et `LessonsController` utilisent un préfixe vide pour combiner les URL `/courses/:id/modules` (création/listage imbriqués) et `/modules/:id` (opérations standalone) dans un seul contrôleur, sans duplication de service
- Vérification de propriété dans la couche service : comparaison `formateurId` avant toute mutation

**Contrôle d'accès (`apps/api/src/auth/`)**
- Nouveau décorateur `@Roles(...roles)` (`roles.decorator.ts`) — liste les rôles autorisés sur un handler
- Nouveau `RolesGuard` (`roles.guard.ts`) — lit le claim `role` du JWT et le compare aux rôles déclarés ; combiné avec `JwtAccessGuard` sur toutes les routes d'écriture FORMATEUR
- `app.module.ts` : imports de `CoursesModule`, `ModulesModule`, `LessonsModule`

**Frontend — types TypeScript (`apps/web/src/lib/types.ts`)**
- `CourseStatus` supprimé → `LessonType = 'VIDEO'`
- `Chapter` → `CourseModule` (champs `title`, `order`, `courseId`, `lessons: Lesson[]`)
- Nouveau type `Lesson` (id, title, type, url?, order, moduleId, completed?)
- `Course` : `status` → `published: boolean`, `chapters` → `modules: CourseModule[]`, ajout de `_count`
- `Enrollment` : `completedChapters` → `completedModules`

**Frontend — client API (`apps/web/src/lib/api.ts`)**
- Interfaces de payload : `CoursePayload`, `ModulePayload`, `LessonPayload`
- Trois namespaces typés : `coursesApi`, `modulesApi`, `lessonsApi` — chacun expose `findAll/findOne/create/update/remove` (ou équivalents) avec authentification Bearer

**Frontend — données mock et pages**
- `mock-data.ts` migré vers la structure `CourseModule[]` + `Lesson[]`
- Pages apprenant (`catalogue`, `cours/[id]`, `cours/[id]/chapitre/[chapitreId]`, `cours/[id]/quiz/[quizId]`, `dashboard`) et pages formateur (`formateur`, `formateur/cours/[id]`) mises à jour pour utiliser `modules`/`lessons` à la place de `chapters`
- `CourseCard` adapté (`published` au lieu de `status`)

### Alignement design

Aucune maquette spécifique pour ce ticket. Les pages existantes du ticket 334f8 ont été mises à jour pour refléter la nouvelle hiérarchie sans modifier la structure visuelle : les listes de chapitres deviennent des listes de modules groupant des leçons. Le booléen `published` permet d'afficher le même badge "Publié / Brouillon" que les maquettes MVP sans enum à trois états.

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/api/prisma/schema.prisma` | Schéma v1 avec Module, Lesson, ModuleProgress |
| `apps/api/src/courses/` | Module NestJS CRUD cours |
| `apps/api/src/modules/` | Module NestJS CRUD modules |
| `apps/api/src/lessons/` | Module NestJS CRUD leçons |
| `apps/api/src/auth/decorators/roles.decorator.ts` | Décorateur `@Roles()` |
| `apps/api/src/auth/guards/roles.guard.ts` | Guard de vérification de rôle JWT |
| `apps/api/src/app.module.ts` | Import des trois nouveaux modules |
| `apps/web/src/lib/types.ts` | Types TS alignés sur le contrat API v1 |
| `apps/web/src/lib/api.ts` | Clients `coursesApi`, `modulesApi`, `lessonsApi` |
| `apps/web/src/lib/mock-data.ts` | Données mock migrées vers Module/Lesson |

### Notes

- Les routes standalone (`/modules/:id`, `/lessons/:id`) évitent de forcer le client à connaître l'identifiant parent lors d'une mise à jour ou suppression isolée.
- En v2 : ajouter la pagination sur `GET /courses`, le quiz par module (référence `moduleId` déjà en place), le suivi de progression via `ModuleProgress`, et brancher les pages frontend sur l'API réelle (remplacer les mocks).
- Le `RolesGuard` est combinable avec n'importe quel autre guard JWT et pourra être étendu au rôle `ADMIN` sans modification structurelle.

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
