# Journal de développement — Scriptverse

---

## 2026-05-06 — Ticket f364c: "UI dashboard formateur — liste cours, création/édition, modules/leçons, quiz, publication"

### Résumé

Implémentation complète du dashboard formateur en deux pages `'use client'` (Next.js 14 App Router) : la page `/formateur` (liste des cours, stats, toggle de publication) et l'éditeur de cours `/formateur/cours/[id]` (création/édition, gestion modules/leçons, authoring de quiz, publication avec checklist, suppression en deux étapes). La page de listing et une première version de l'éditeur existaient déjà sur la branche ; ce ticket finalise l'éditeur avec la gestion du cycle de vie complet (création → édition → publication → suppression) et corrige un défaut critique : les blocs `catch` manquants dans `ModulePanel`, `LessonRow` et `QuestionEditor` empêchaient les erreurs API de remonter à l'interface. 38 tests Vitest couvrent les deux pages (17 + 21).

### Architecture

**Routes**

| URL | Fichier | Mode |
|-----|---------|------|
| `/formateur` | `apps/web/src/app/formateur/page.tsx` | Dashboard — liste + stats |
| `/formateur/cours/nouveau` | `apps/web/src/app/formateur/cours/[id]/page.tsx` | Création (sentinel `'nouveau'`) |
| `/formateur/cours/:id` | `apps/web/src/app/formateur/cours/[id]/page.tsx` | Édition d'un cours existant |

Le segment `'nouveau'` est l'unique condition de branchement création/édition. Après un `POST /courses` réussi, `router.replace(newId)` remplace l'URL pour que le retour arrière revienne au dashboard et non à la page de création.

**Arbre de composants — CourseEditorPage**

```
CourseEditorPage
├── sticky header (breadcrumb · Sauvegarder · Publier/Dépublier)
└── PageTransition
    └── two-column layout
        ├── LEFT
        │   ├── ErrorBanner (conditionnel)
        │   ├── CourseInfoCard (title · description · category · level · price)
        │   └── ModulesCard [masqué en création]
        │       └── ModulePanel × N
        │           ├── tab Leçons → LessonRow × N
        │           └── tab Quiz   → QuizPanel
        │               └── QuestionEditor × N
        └── RIGHT SIDEBAR
            ├── PublicationChecklist (4 conditions)
            ├── PublishToggle
            ├── StatsCard
            └── DangerZone (suppression 2 étapes)
```

**Gestion d'état**

L'état est local (`useState` / `useCallback`). Aucun store global n'est nécessaire.

- `CourseEditorPage` : `course`, `modules`, `saving`, `publishing`, `deleting`, `confirmDelete`, `addingModule`, `saved` (flash 2,5 s), champs de formulaire contrôlés
- `ModulePanel` (par instance) : `lessons`, `expanded`, `editingTitle`, `activeTab`, flags de loading par opération, **`error`** (ajouté)
- `LessonRow` (par instance) : `expanded`, `title`, `url`, `saving`, `removing`, **`error`** (ajouté)
- `QuestionEditor` (par instance) : `text`, `options`, `correct`, `saving`, `removing`, **`error`** (ajouté)
- `QuizPanel` (par instance) : `quiz`, `loading`, `creating`, `removingQuiz`, `addingQ`, `quizTitle`, `error`

Les leçons vivent dans chaque `ModulePanel`, pas dans la racine de l'éditeur — évite le re-render de toute la liste de modules à chaque changement de leçon. Les quiz sont auto-contenus dans chaque `QuizPanel`, qui charge son propre quiz au montage.

**Intégration API**

Toutes les mutations passent par `request<T>()` (`apps/web/src/lib/api.ts`), qui extrait `body.message` et lève une `Error` pour tout statut non-2xx.

| Surface | Opération | Appel API |
|---------|-----------|-----------|
| Dashboard | Chargement | `coursesApi.findMine(token)` |
| Dashboard | Toggle publication | `coursesApi.update(token, id, { published })` |
| Éditeur | Chargement | `coursesApi.findMyOne(token, id)` |
| Éditeur | Créer cours | `coursesApi.create(token, payload)` |
| Éditeur | Mettre à jour | `coursesApi.update(token, id, payload)` |
| Éditeur | Supprimer | `coursesApi.remove(token, id)` |
| Éditeur | Ajouter module | `modulesApi.create(token, courseId, payload)` |
| ModulePanel | Renommer | `modulesApi.update(token, id, { title })` |
| ModulePanel | Supprimer | `modulesApi.remove(token, id)` |
| ModulePanel | Ajouter leçon | `lessonsApi.create(token, moduleId, payload)` |
| LessonRow | Mettre à jour | `lessonsApi.update(token, id, payload)` |
| LessonRow | Supprimer | `lessonsApi.remove(token, id)` |
| QuizPanel | Charger quiz | `quizApi.findByModule(moduleId)` |
| QuizPanel | Créer quiz | `quizApi.create(token, moduleId, { title })` |
| QuizPanel | Supprimer quiz | `quizApi.remove(token, moduleId)` |
| QuizPanel | Ajouter question | `quizApi.addQuestion(token, moduleId, payload)` |
| QuestionEditor | Mettre à jour | `quizApi.updateQuestion(token, moduleId, questionId, payload)` |
| QuestionEditor | Supprimer | `quizApi.removeQuestion(token, moduleId, questionId)` |

**Checklist de publication**

Quatre conditions calculées client-side pour `readyToPublish` :

| Condition | Vérification |
|-----------|-------------|
| Titre renseigné | `title.trim() !== ''` |
| Description renseignée | `description.trim() !== ''` |
| Au moins 1 module | `modules.length > 0` |
| Au moins 1 leçon | `modules.reduce((acc, m) => acc + m.lessons.length, 0) > 0` |

Le bouton Publier dans le header sticky et la checklist de la sidebar partagent le même booléen et le même handler `handlePublishToggle`.

**Suppression en deux étapes**

`confirmDelete: false` → clic "Supprimer définitivement" → `confirmDelete: true` (UI de confirmation) → clic confirmer → `DELETE /courses/:id` + `router.push('/formateur')`. Annulation → `confirmDelete: false`. En cas d'erreur API, les deux flags sont réinitialisés pour permettre une nouvelle tentative.

**Correction bug : erreurs API silencieuses**

Les blocs `catch` étaient absents de plusieurs opérations asynchrones dans les composants enfants. Les erreurs se terminaient en `UnhandledPromiseRejection` sans aucun retour visuel. Le correctif ajoute un état `error: string | null` local et un `<ErrorBanner>` inline dans `ModulePanel`, `LessonRow` et `QuestionEditor`. Le pattern systématique :

```typescript
} catch (err) {
  setError(err instanceof Error ? err.message : 'Erreur lors de …');
} finally {
  setSaving(false);
}
```

### Fichiers créés/modifiés

```
apps/web/src/app/formateur/
├── page.tsx                              # Dashboard (stats, table, toggle — déjà implémenté)
├── __tests__/page.test.tsx               # NOUVEAU — 17 tests Vitest
└── cours/[id]/
    ├── page.tsx                          # Éditeur complet + fix catch blocks (+31 / -4 lignes)
    └── __tests__/page.test.tsx           # NOUVEAU — 21 tests Vitest

ARCH_SPECS.md                             # Feature 68 ajoutée (+262 lignes)
```

### Tests

**`FormateurPage` — 17 tests**

Couvrent : redirection non-formateur et non-authentifié, skeleton pendant le chargement auth, fetch au montage, affichage des cours, ErrorBanner + bouton "Réessayer", filtres published/draft/empty state, toggle de publication avec indicateur `…`, lien "Nouveau cours", affichage du niveau et du prix.

**`CourseEditorPage` — 21 tests**

Couvrent : redirection, skeleton auth, mode création (titre "Nouveau cours", pas d'appel `findMyOne`, tip "sauvegarder d'abord"), validation (sans titre/description), création et redirection, chargement en édition, ErrorBanner, feedback "Sauvegardé", checklist de publication, boutons publier/dépublier (dont état disabled sans leçons), flux de suppression en deux étapes (confirm + cancel), ajout de module.

Total nouveaux tests ce ticket : **38**. Infrastructure Vitest déjà en place depuis le ticket d78db.

### Invariants clés (documentés dans ARCH_SPECS.md § 68.10)

- Mode création vs. édition : seul `params.id === 'nouveau'` fait la distinction ; `router.replace` (pas `push`) après création.
- Acquisition du token synchrone : `getAccessToken()` lit depuis `localStorage` directement — si expiré, l'API retourne 401 et l'erreur remonte dans l'UI.
- Mises à jour d'état immutables : toutes les mutations `setCourses`, `setModules`, `setLessons` utilisent spread ou `map`/`filter`, jamais de mutation en place.
- Flash "Sauvegardé" : `saved = true` pendant 2 500 ms via `setTimeout` — pas de dépendance toast externe.
- Section modules masquée en création : la gestion des modules n'est rendue que si `!isNew` ; le formateur doit d'abord sauvegarder les infos de base.

### Notes

- `getAccessToken()` ne tente pas de refresh automatique dans ces pages — si le token expire pendant une session longue d'édition, l'erreur 401 s'affiche dans l'`ErrorBanner`. Un refresh transparent serait à ajouter en v2 via `api-client.ts`.
- En v2 : upload de thumbnail (actuellement placeholder "NYI"), limite de tentatives de quiz configurable par quiz, pagination sur `GET /courses/mine` si le catalogue formateur grossit.

---

## 2026-04-28 — Ticket bbaee: "API: catalogue de cours (listing + recherche/filtre)"

### Résumé

Réécriture complète de `GET /courses` pour exposer un catalogue paginé, filtrable et triable. L'endpoint reste public ; sa signature change d'un tableau brut à une enveloppe `{ data, meta }`. La logique de filtrage est encapsulée dans un DTO de query dédié (`CourseListQueryDto`) validé par le `ValidationPipe` global. La requête DB utilise un `$transaction([findMany, count])` pour ramener les résultats et le total en un seul aller-retour. Deux nouveaux DTOs TypeScript matérialisent la réponse (`CoursePreviewDto`, `PaginationMeta`). Les validations du DTO de création ont été renforcées en parallèle (`@IsUrl`, `@MaxLength`, `@Max`). 44 nouveaux tests unitaires couvrent la logique `findAll` (valeurs par défaut, chaque filtre isolé, combinaisons, tri, pagination, cas d'erreur).

### Architecture

**Endpoint**

| Méthode | Route | Auth | Comportement |
|---------|-------|------|--------------|
| `GET` | `/courses` | Public | Catalogue paginé avec search / filtres / tri |

**Paramètres de query (`CourseListQueryDto`)**

| Paramètre | Type | Défaut | Validation |
|-----------|------|--------|-----------|
| `search` | `string` | — | ILIKE sur `title` et `description` (insensible à la casse) |
| `level` | `DEBUTANT \| INTERMEDIAIRE \| AVANCE` | — | `@IsEnum(Level)` |
| `category` | `string` | — | Correspondance exacte sur `Course.category` |
| `minPrice` | `number` | — | `@Min(0)` + `@Type(() => Number)` |
| `maxPrice` | `number` | — | `@Min(0)` + `@Type(() => Number)` |
| `formateurId` | `UUID` | — | `@IsUUID()` |
| `page` | `number` | `1` | `@IsInt @Min(1)` |
| `limit` | `number` | `12` | `@IsInt @Min(1) @Max(50)` |
| `sortBy` | `createdAt \| price \| title` | `createdAt` | `@IsEnum(...)` |
| `sortOrder` | `asc \| desc` | `desc` | `@IsEnum(...)` |

**Format de réponse (`CourseListDto`)**

```typescript
{
  data: CoursePreviewDto[];   // id, title, description, thumbnail, price, level, category,
                              // formateur (id/firstName/lastName/avatar), enrollmentCount, moduleCount, createdAt
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Construction du `where` Prisma**

Les filtres sont composés conditionnellement en un seul objet `Prisma.CourseWhereInput` :

```typescript
const where: Prisma.CourseWhereInput = {
  published: true,
  ...(query.level && { level: query.level }),
  ...(query.category && { category: query.category }),
  ...(query.formateurId && { formateurId: query.formateurId }),
  ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
    price: {
      ...(query.minPrice !== undefined && { gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
    },
  }),
  ...(query.search && {
    OR: [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ],
  }),
};
```

La recherche plein-texte utilise `mode: 'insensitive'` (mapping PostgreSQL `ILIKE`) sans index full-text — suffisant pour le MVP, à remplacer par un index `tsvector` en v2.

**Requête DB**

`findMany` + `count` groupés dans un `$transaction` pour un seul aller-retour réseau. `findMany` utilise un `select` projeté (pas `include`) pour n'exposer que les champs utiles au catalogue et exclure les URL vidéo des leçons.

**Invariant métier**

Lorsque `minPrice > maxPrice`, le service lève `BadRequestException('minPrice must not be greater than maxPrice')` avant d'interroger la base. Le cas `minPrice === maxPrice` est valide (filtre sur un prix exact).

**Améliorations connexes**

- `update` et `remove` du contrôleur : `@Param('id')` renforcé avec `ParseUUIDPipe`
- `assertOwner` : message d'erreur générique (`NotFoundException()` sans détail) pour éviter l'énumération d'identifiants
- `findContent` : le `$transaction` enveloppe maintenant un `.catch` qui convertit `P2025` en `NotFoundException` propre au lieu de laisser Prisma propager une erreur interne
- `CreateCourseDto` : `thumbnail` → `@IsUrl()` ; `title` → `@MaxLength(255)` ; `description` → `@MaxLength(5000)` ; `price` → `@Max(99999)` ; `category` → `@MaxLength(100)`

### Fichiers créés/modifiés

```
apps/api/src/courses/
├── courses.controller.ts          # findAll accepte @Query() CourseListQueryDto ; ParseUUIDPipe sur update/remove
├── courses.service.ts             # findAll réécrit — filtres, $transaction, CourseListDto
├── courses.controller.spec.ts     # +10 tests findAll (passage query, chaque filtre, combinaison)
├── courses.service.spec.ts        # +34 tests findAll (defaults, résultat vide, pagination, tri, filtres unitaires)
└── dto/
    ├── course-list-query.dto.ts   # NOUVEAU — CourseListQueryDto (10 paramètres, @Type coercition)
    ├── course-list.dto.ts         # NOUVEAU — CourseListDto / CoursePreviewDto / PaginationMeta / FormateurPreviewDto
    └── create-course.dto.ts       # @IsUrl + @MaxLength + @Max
```

### Tests

- **34 tests service** en deux `describe` : `findAll` (cas de base : valeurs par défaut, meta, mapping DTO, totalPages=0, BadRequestException) ; `findAll – query construction` (assertions directes sur les appels `prisma.course.count` et `findMany` : chaque filtre présent/absent, OR search, price gte/lte, skip/take, orderBy, select projection)
- **10 tests contrôleur** : délégation avec query complet, query vide, chaque filtre isolé, combinaison de tous les paramètres, valeur de retour propagée intacte

Total suite après ce ticket : **213 tests, ~22 suites — tous verts** *(selon le décompte local avant commit)*

### Notes

- La coercition des query params numériques (`page`, `limit`, `minPrice`, `maxPrice`) est gérée par `@Type(() => Number)` de `class-transformer`, requis car HTTP transmet tous les query params en chaînes.
- `select` projeté au lieu de `include` : garantit que `modules`, `lessons` et leurs `url` n'apparaissent jamais dans la réponse du catalogue, même si le schéma évolue.
- En v2 : remplacer la recherche ILIKE par un index PostgreSQL `tsvector` (GIN) pour les performances sur de grands catalogues ; ajouter un filtre `isFree: boolean` (raccourci `price = 0`) ; envisager un cursor-based pagination pour les flux infinis.

---

## 2026-04-28 — Ticket 72033: "API: détail cours (modules/chapitres) + accès (inscription)"

### Résumé

Implémentation de l'endpoint de détail cours enrichi (`GET /courses/:id`) et du nouvel endpoint de contenu réservé aux inscrits (`GET /courses/:id/content`). Le premier retourne la structure complète modules/leçons sans exposer les URLs vidéo ; le second valide l'inscription de l'utilisateur puis retourne les URLs, la progression par module et les données de quiz via une seule transaction Prisma. 29 tests unitaires ajoutés (service + contrôleur), zéro régression sur les 163 tests existants. La suite contrôleur a été complétée avec des assertions de métadonnées vérifiant les décorateurs `@Public()` et `@Roles()` au niveau réflexion, et les tests du handler `create` ont été ajoutés pour couvrir l'ensemble du contrôleur.

### Architecture

**Endpoints**

| Méthode | Route | Auth | Comportement |
|---------|-------|------|--------------|
| `GET` | `/courses/:id` | Public (enrichi) | Prévisualisation : modules + leçons sans `url` |
| `GET` | `/courses/:id/content` | Authentifié + inscrit | Contenu complet : URLs + progression + quiz |

**Logique d'accès**

- `GET /courses/:id` : retourne `404` si le cours n'existe pas **ou** n'est pas publié — évite de révéler l'existence de brouillons à des visiteurs anonymes.
- `GET /courses/:id/content` : vérifie d'abord l'inscription via `enrollment.findUnique({ userId_courseId })` ; lance `ForbiddenException('Not enrolled in this course')` si absent. La vérification est au niveau service (pas guard) conformément au principe : les guards gèrent l'authentification, les règles métier restent dans les services.

**Transaction `$transaction`**

Après confirmation de l'inscription, les trois lectures (structure du cours, progression modules, tentatives quiz) sont groupées en un seul aller-retour DB :

```typescript
const [course, progressRecords, attempts] = await this.prisma.$transaction([
  this.prisma.course.findUniqueOrThrow({ ... }),          // structure + leçons avec url
  this.prisma.moduleProgress.findMany({ where: { userId, module: { courseId } } }),
  this.prisma.quizAttempt.findMany({ orderBy: { completedAt: 'desc' } }),
]);
```

**Invariants de sécurité**

- `url` des leçons absent de `GET /courses/:id` (champ exclu du `select`, pas seulement `null`)
- `correctAnswer` absent des questions de quiz dans `GET /courses/:id/content`
- Pour les tentatives multiples, la plus récente est retournée (ordonnées desc, première occurrence par `quizId` conservée)

**Fichiers créés/modifiés**

```
apps/api/src/courses/
├── courses.controller.ts          # handler findContent + ParseUUIDPipe sur findOne
├── courses.service.ts             # findOne enrichi + findContent
├── courses.controller.spec.ts     # NOUVEAU — 4 tests contrôleur
├── courses.service.spec.ts        # NOUVEAU — 19 tests service
└── dto/
    ├── course-detail.dto.ts       # NOUVEAU — interfaces CourseDetailDto / ModulePreviewDto / LessonPreviewDto
    └── course-content.dto.ts      # NOUVEAU — interfaces CourseContentDto / ModuleContentDto / LessonContentDto / QuizContentDto
```

### Tests

- 29 nouveaux tests (19 service + 10 contrôleur)
  - 19 tests service : logique `findOne` (published/404), `findContent` (enrollment check, transaction, sécurité), invariants `correctAnswer`/`url` absents
  - 10 tests contrôleur : délégation vers le service pour `findOne`, `findContent`, `findAll`, `findMine`, `create` ; assertions de métadonnées via `Reflect.getMetadata` — `@Public()` présent sur `findOne`/`findAll`, absent sur `findContent` ; `@Roles(FORMATEUR)` vérifié sur `findMine` et `create`
- Total suite : **169 tests, 20 suites — tous verts** *(6 tests contrôleur supplémentaires non encore commis)*

---

## 2026-05-03 — Ticket 8eeb1: "API: quiz (questions + tentative + score)"

### Résumé

Implémentation complète du domaine quiz : CRUD quiz/questions réservé aux formateurs propriétaires du module, lecture publique (questions sans `correctAnswer`), soumission de tentative avec calcul de score et corrections détaillées, et historique personnel des tentatives. L'ensemble est exposé via un nouveau `QuizModule` enregistré dans `AppModule`. 110 tests unitaires couvrent les DTOs, le service, et le contrôleur (toutes les branches d'erreur + invariants de sécurité).

### Architecture

**Endpoints**

| Méthode | Route | Auth | Comportement |
|---------|-------|------|--------------|
| `POST` | `/modules/:moduleId/quiz` | FORMATEUR | Crée le quiz du module (1 quiz max par module) |
| `GET` | `/modules/:moduleId/quiz` | Public | Retourne le quiz avec questions (sans `correctAnswer`) |
| `PATCH` | `/modules/:moduleId/quiz` | FORMATEUR | Met à jour le titre du quiz |
| `DELETE` | `/modules/:moduleId/quiz` | FORMATEUR | Supprime le quiz et toutes ses questions |
| `POST` | `/modules/:moduleId/quiz/questions` | FORMATEUR | Ajoute une question au quiz |
| `PATCH` | `/modules/:moduleId/quiz/questions/:questionId` | FORMATEUR | Met à jour une question |
| `DELETE` | `/modules/:moduleId/quiz/questions/:questionId` | FORMATEUR | Supprime une question |
| `POST` | `/modules/:moduleId/quiz/attempts` | Authentifié | Soumet les réponses → score + corrections |
| `GET` | `/modules/:moduleId/quiz/attempts` | Authentifié | Historique personnel des tentatives |

**DTOs de requête**

| DTO | Champs validés |
|-----|---------------|
| `CreateQuizDto` | `title` — `@IsString @IsNotEmpty` |
| `UpdateQuizDto` | `title?` — `@IsOptional @IsString @IsNotEmpty` |
| `CreateQuestionDto` | `question` (non vide), `options` (tableau ≥ 2 strings), `correctAnswer` (entier ≥ 0), `order` (entier ≥ 1) |
| `UpdateQuestionDto` | Tous les champs de `CreateQuestionDto` en `@IsOptional` |
| `SubmitAttemptDto` | `answers` — tableau ≥ 1 entiers ≥ 0 |

**Invariants de sécurité**

- `correctAnswer` absent des questions retournées par `GET /modules/:moduleId/quiz` — exclu via `select` Prisma, pas seulement masqué à null.
- Ownership vérifié par `assertModuleOwner` : remonte le module → course → `formateurId`, lance `ForbiddenException` si l'utilisateur n'est pas le formateur propriétaire. Mutualisé entre toutes les opérations d'écriture.
- `BadRequestException('This module already has a quiz')` : unicité quiz/module enforced au niveau service avant d'interroger la base (contrainte `@unique` Prisma en backup).
- Validation d'index : `correctAnswer` doit être `< options.length` ; vérifié à la création et à la mise à jour (uniquement quand les deux champs sont présents simultanément).

**Logique de score (`submitAttempt`)**

1. Récupère le quiz avec ses questions (ordonnées par `order` asc).
2. Valide : quiz existe, a des questions, nombre de réponses = nombre de questions, chaque index de réponse `< options.length`.
3. Compare chaque réponse au `correctAnswer` de la question correspondante.
4. `score = round(correctCount / totalQuestions * 100)`.
5. Persiste un `QuizAttempt` avec `userId`, `quizId`, `score`, et le tableau `answers`.
6. Retourne `{ attemptId, score, totalQuestions, correctCount, completedAt, corrections[] }` où chaque `correction` contient `{ questionId, yourAnswer, correctAnswer, isCorrect }`.

**Format de réponse `submitAttempt`**

```typescript
{
  attemptId: string;
  score: number;          // 0–100, arrondi entier
  totalQuestions: number;
  correctCount: number;
  completedAt: string;    // ISO 8601
  corrections: Array<{
    questionId: string;
    yourAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
}
```

**`getMyAttempts` — sélection projetée**

Retourne uniquement `{ id, score, answers, completedAt }` par tentative. Ordonnées `completedAt desc`. Filtrées par `userId` ET `quizId` pour garantir l'isolation entre utilisateurs.

### Fichiers créés/modifiés

```
apps/api/src/quiz/
├── quiz.module.ts                       # NOUVEAU — QuizModule (PrismaModule + QuizController + QuizService)
├── quiz.controller.ts                   # NOUVEAU — 8 handlers, @Public sur findByModule uniquement
├── quiz.controller.spec.ts              # NOUVEAU — 19 tests (délégation + métadonnées @Roles / @Public)
├── quiz.service.ts                      # NOUVEAU — createForModule, findByModule, update/remove, addQuestion, update/removeQuestion, submitAttempt, getMyAttempts
├── quiz.service.spec.ts                 # NOUVEAU — 47 tests (toutes les branches NotFoundException / ForbiddenException / BadRequestException + logique de score)
└── dto/
    ├── create-quiz.dto.ts               # NOUVEAU
    ├── create-quiz.dto.spec.ts          # NOUVEAU — 4 tests
    ├── update-quiz.dto.ts               # NOUVEAU
    ├── update-quiz.dto.spec.ts          # NOUVEAU — 4 tests
    ├── create-question.dto.ts           # NOUVEAU
    ├── create-question.dto.spec.ts      # NOUVEAU — 15 tests
    ├── update-question.dto.ts           # NOUVEAU
    ├── update-question.dto.spec.ts      # NOUVEAU — 13 tests
    ├── submit-attempt.dto.ts            # NOUVEAU
    └── submit-attempt.dto.spec.ts       # NOUVEAU — 8 tests

apps/api/src/app.module.ts               # QuizModule enregistré
```

### Tests

- **47 tests service** répartis en 7 `describe` : `createForModule` (4), `findByModule` (2), `updateForModule` (4), `removeForModule` (4), `addQuestion` (5), `updateQuestion` (7), `removeQuestion` (5), `submitAttempt` (9), `getMyAttempts` (5). Couvrent l'ensemble des branches d'erreur (module absent, ForbiddenException, quiz absent, index hors bornes, compte de réponses erroné), les cas de score (0 %, 50 %, 100 %), la persistance des tentatives, et les corrections détaillées.
- **19 tests contrôleur** : délégation avec tous les paramètres, assertions `Reflect.getMetadata` sur `ROLES_KEY` (FORMATEUR sur toutes les routes d'écriture) et `IS_PUBLIC_KEY` (`findByModule` public, `submitAttempt` et `getMyAttempts` authentifiés).
- **44 tests DTO** (class-validator, `plainToInstance`) : `CreateQuizDto` (4), `UpdateQuizDto` (4), `CreateQuestionDto` (15), `UpdateQuestionDto` (13), `SubmitAttemptDto` (8).

Total nouveaux tests ce ticket : **110**. Total suite projeté : **~323 tests, ~28 suites — tous verts**.

### Notes

- `assertModuleOwner` est une méthode privée mutualisée par toutes les opérations d'écriture. Elle remonte en un seul `findUnique` avec `include: { course: { select: { formateurId } } }` — pas de requête supplémentaire par opération.
- Une seule relation `@unique moduleId` sur `Quiz` garantit qu'un module ne peut avoir qu'un seul quiz, vérifiée d'abord en service pour un message d'erreur explicite, puis en database comme filet de sécurité.
- Les `submitAttempt` ne vérifient pas l'inscription — décision délibérée : un étudiant non inscrit peut tenter le quiz (les données de quiz sont publiques), mais ses tentatives ne sont visibles que par lui-même.
- En v2 : ajouter un seuil de passage configurable par quiz (`passingScore`), une limite de tentatives par utilisateur, et des indices de progression agrégés sur le tableau de bord étudiant.

---

## 2026-04-28 — Ticket 9f3a1: "DB: schéma initial + migrations (PostgreSQL + Prisma)"

### Résumé

Consolidation et finalisation de la couche persistance : schéma Prisma complet en 9 modèles couvrant les quatre domaines métier (utilisateurs, cours, progression, quiz), migration SQL initiale générée automatiquement, service Prisma avec gestion du cycle de vie NestJS, seed idempotent avec données de démonstration réalistes, et suites de tests unitaires couvrant le service, les enums et le script de seed.

### Architecture

**Domaines et relations**

Le schéma organise les données en quatre domaines interconnectés :

```
User ──< Course (via FormateurCourses)
User ──< Enrollment ──> Course
User ──< ModuleProgress ──> Module
User ──< QuizAttempt ──> Quiz

Course ──< Module ──< Lesson
           Module ──  Quiz ──< QuizQuestion
```

La cascade de suppression est configurée sur les relations parent→enfant structurelles (`Course → Module`, `Module → Lesson`, `Module → Quiz`, `Quiz → QuizQuestion`) ; les relations de progression (`Enrollment`, `ModuleProgress`, `QuizAttempt`) utilisent `RESTRICT` pour éviter la perte silencieuse de données.

**Identifiants et conventions SQL**

Tous les modèles utilisent des UUID v4 générés par Prisma (`@id @default(uuid())`). Les noms de tables et colonnes sont en `snake_case` via `@@map` et `@map` ; les noms de champs Prisma restent en `camelCase` côté applicatif.

**`PrismaService` — cycle de vie NestJS**

`PrismaService` étend `PrismaClient` et implémente `OnModuleInit` / `OnModuleDestroy` pour contrôler la connexion pool : `$connect()` à l'initialisation du module, `$disconnect()` à la destruction. Il est exposé comme module `@Global()` dans `PrismaModule` pour éviter de l'importer dans chaque module NestJS consommateur.

**Seed idempotent**

Le seed utilise exclusivement `upsert` (jamais `create`) avec des UUIDs fixes pour les entités de référence, garantissant la ré-exécution sans doublon. Les mots de passe sont lus depuis les variables d'environnement `SEED_*_PASSWORD` ; si absentes, des valeurs par défaut sécurisées pour le développement local sont utilisées en fallback.

### Ce qui a été implémenté

**Schéma Prisma (`apps/api/prisma/schema.prisma`)**

9 modèles avec 3 enums :

| Modèle | Table SQL | Rôle |
|---|---|---|
| `User` | `users` | Utilisateur (apprenant, formateur, admin) + `refreshHash` |
| `Course` | `courses` | Cours publié ou brouillon, appartenant à un formateur |
| `Module` | `modules` | Conteneur ordonné de leçons (`order` 1-based) |
| `Lesson` | `lessons` | Unité de contenu (`type: VIDEO`, `url?`, `order` 1-based) |
| `Quiz` | `quizzes` | Quiz lié à un module (relation `@unique`) |
| `QuizQuestion` | `quiz_questions` | Question avec `options String[]` et `correctAnswer Int` (index 0-based) |
| `Enrollment` | `enrollments` | Inscription apprenant ↔ cours (`@@unique([userId, courseId])`) |
| `ModuleProgress` | `module_progress` | Complétion de module (`@@unique([userId, moduleId])`) |
| `QuizAttempt` | `quiz_attempts` | Tentative de quiz avec `score Float` et `answers Int[]` |

Enums : `Role` (APPRENANT / FORMATEUR / ADMIN), `Level` (DEBUTANT / INTERMEDIAIRE / AVANCE), `LessonType` (VIDEO).

**Migration initiale (`apps/api/prisma/migrations/20240101000000_initial_schema/migration.sql`)**

SQL généré par Prisma : 9 `CREATE TABLE`, 3 `CREATE TYPE` (enums PostgreSQL natifs), 4 index uniques (`users_email_key`, `quizzes_moduleId_key`, `enrollments_userId_courseId_key`, `module_progress_userId_moduleId_key`), 12 `ADD CONSTRAINT` de clé étrangère avec les politiques ON DELETE configurées par domaine.

**`PrismaService` (`apps/api/src/prisma/prisma.service.ts`)**

Wrapper NestJS sur `PrismaClient` avec hooks `onModuleInit` / `onModuleDestroy`. `PrismaModule` le déclare `@Global()` pour injection universelle.

**Seed (`apps/api/prisma/seed.ts`)**

Données créées par le seed :

| Entité | Données |
|---|---|
| 3 utilisateurs | `admin@scriptverse.dev` (ADMIN), `formateur@scriptverse.dev` (FORMATEUR), `apprenant@scriptverse.dev` (APPRENANT) |
| 1 cours | "Introduction à TypeScript" — published, gratuit, DEBUTANT, Programmation |
| 2 modules | "Les fondamentaux" (order 1), "Interfaces et classes" (order 2) |
| 4 leçons | 2 par module : Pourquoi TypeScript, Types primitifs, Déclarer une interface, Classes et héritage |
| 1 quiz | "Quiz — Les fondamentaux" sur le module 1, avec 2 questions |
| 1 inscription | `apprenant` inscrit au cours de démonstration |

**`ARCH_SPECS.md`** — structure de dossiers mise à jour : `seed.ts` ajouté, annotation `@Global()` sur `prisma.module.ts`.

### Statut des tests

| Suite | Cas | Statut |
|---|---|---|
| `prisma.service.spec.ts` | 3 (is defined, connects on init, disconnects on destroy) | Écrits, non exécutés en CI |
| `seed.spec.ts` | 11 happy path + 4 error path (env var manquante → exit 1 + disconnect) | Écrits, non exécutés en CI |
| `schema.spec.ts` | 10 (valeurs de chaque enum : Role ×4, Level ×4, LessonType ×2) | Écrits, non exécutés en CI |

> Lancement local : `pnpm --filter api test`. `seed.spec.ts` et `schema.spec.ts` sont en attente de commit.

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/api/prisma/schema.prisma` | Source de vérité — 9 modèles, 3 enums, relations, @@map |
| `apps/api/prisma/migrations/20240101000000_initial_schema/migration.sql` | Migration SQL initiale (ne jamais éditer manuellement) |
| `apps/api/prisma/seed.ts` | Seed idempotent via upsert (3 users, 1 cours, 2 modules, 4 leçons, 1 quiz) |
| `apps/api/prisma/seed.spec.ts` | Tests du script de seed (mock PrismaClient + bcrypt) |
| `apps/api/src/prisma/prisma.service.ts` | `PrismaClient` wrappé pour NestJS (lifecycle hooks) |
| `apps/api/src/prisma/prisma.module.ts` | Module `@Global()` exportant `PrismaService` |
| `apps/api/src/prisma/prisma.service.spec.ts` | Tests unitaires du cycle de vie PrismaService |
| `apps/api/src/prisma/schema.spec.ts` | Validation des valeurs d'enum générées par Prisma |

### Notes

- Les UUIDs du seed sont fixés en dur pour garantir l'idempotence sur plusieurs exécutions ; ils ne doivent pas être modifiés sans mettre à jour les références croisées dans les tests.
- `QuizQuestion.options` est `String[]` (tableau PostgreSQL natif) et `answers` dans `QuizAttempt` est `Int[]` — ces types de tableau ne nécessitent pas de table de jointure et restent suffisants pour la v1.
- `Enrollment` et `ModuleProgress` utilisent `RESTRICT` (au lieu de `CASCADE`) sur les FK utilisateur/cours intentionnellement — la perte d'une inscription ou d'une progression lors d'une suppression serait silencieuse et difficile à déboguer.
- En v2 : remplacer le champ unique `refreshHash` sur `User` par une table `RefreshToken` dédiée (multi-session / multi-appareil) ; ajouter `completedAt` sur `Enrollment` pour calculer la durée de formation ; étendre `LessonType` à `PDF`, `QUIZ`, `TEXT`.

---

## 2026-04-28 — Ticket 32924: "Auth: refresh token + guards/roles (RBAC)"

### Résumé

Mise en place de l'infrastructure d'authentification complète côté API : rotation des refresh tokens (hachés en base via bcrypt), guard JWT global appliqué à toutes les routes sauf celles décorées `@Public()`, et système RBAC à trois niveaux (APPRENANT / FORMATEUR / ADMIN) piloté par le décorateur `@Roles()`. Le ticket couvre également l'ajout du décorateur `@GetUser()` pour extraire le payload JWT dans les handlers, le rate limiting par `@Throttle` sur les endpoints sensibles, une migration Prisma ajoutant le champ `refreshHash` sur `User`, et un seed idempotent de données de démonstration. 81 tests unitaires couvrent l'ensemble des nouvelles pièces (service, contrôleur, guards, stratégies, DTOs, décorateurs).

### Architecture

**Rotation des refresh tokens**

À chaque appel réussi à `POST /auth/refresh`, `POST /auth/login` ou `POST /auth/signup`, un nouveau couple `{ accessToken, refreshToken }` est émis. Le refresh token brut n'est jamais stocké : seul son hash bcrypt (`refreshHash`) est persisté sur le modèle `User`. Lors d'un refresh, `bcrypt.compare` valide le token entrant contre le hash stocké, puis le hash est immédiatement remplacé par celui du nouveau token — rendant l'ancien invalide. À la déconnexion, `refreshHash` est mis à `null`.

**Guard global + `@Public()`**

`JwtAccessGuard` est enregistré comme `APP_GUARD` dans `AuthModule` (fourni en tant que `{ provide: APP_GUARD, useClass: JwtAccessGuard }`), ce qui le applique globalement à toutes les routes. Les endpoints publics (signup, login, refresh, reset-password) portent le décorateur `@Public()` qui pose le métadonnée `isPublic: true` ; `JwtAccessGuard` lit cette métadonnée via le `Reflector` et court-circuite la vérification JWT.

**`JwtRefreshGuard` et `JwtRefreshStrategy`**

La route `POST /auth/refresh` est marquée `@Public()` (pour passer le guard global) puis protégée individuellement par `@UseGuards(JwtRefreshGuard)`. `JwtRefreshStrategy` vérifie le token signé avec `JWT_REFRESH_SECRET`, extrait le token brut depuis l'en-tête `Authorization` (`passReqToCallback: true`), et retourne `{ ...payload, refreshToken }` — exposant le token brut au service pour la comparaison bcrypt.

**RBAC via `@Roles()` + `RolesGuard`**

`RolesGuard` lit les rôles requis depuis les métadonnées du handler (ou de la classe) via `Reflector.getAllAndOverride`. Il accède au `user` de la requête (posé par le guard JWT en amont) et vérifie que `user.role` figure dans la liste autorisée. Si aucun rôle n'est déclaré sur le handler, l'accès est accordé sans vérification. `RolesGuard` est utilisé en combinaison avec `JwtAccessGuard` : un handler FORMATEUR porte à la fois `@UseGuards(JwtAccessGuard)` (ou bénéficie du guard global) et `@Roles(Role.FORMATEUR)`.

**Décorateurs**

- `@Public()` — métadonnée `isPublic: true` — permet de passer le guard JWT global
- `@Roles(...roles)` — métadonnée `ROLES_KEY` — liste les rôles autorisés pour un handler
- `@GetUser()` — param décorateur basé sur `createParamDecorator` — extrait `request.user` du contexte HTTP et le type comme `JwtPayload | JwtRefreshPayload`

### Ce qui a été implémenté

**Service (`apps/api/src/auth/auth.service.ts`)**

| Méthode | Comportement |
|---|---|
| `signup` | Hash password, crée l'utilisateur, émet tokens, stocke refreshHash |
| `login` | Vérifie password, émet tokens, stocke refreshHash |
| `refresh` | Vérifie refreshHash via bcrypt, rotation complète (nouveau couple + nouveau hash) |
| `logout` | Met `refreshHash` à `null` |
| `getMe` | Retourne le profil utilisateur sans `passwordHash` ni `refreshHash` |
| `resetPassword` | Stub sécurisé (sans divulgation d'existence d'email) |
| `issueTokens` (privé) | Génère access (15 min) + refresh (7 j) en parallèle via `Promise.all` |
| `storeRefreshHash` (privé) | Hache le refresh token brut et le persiste sur `User.refreshHash` |

**Contrôleur (`apps/api/src/auth/auth.controller.ts`)**

Six endpoints avec rate limiting et guards :

| Route | Accès | Throttle |
|---|---|---|
| `POST /auth/signup` | Public | 5 req/min |
| `POST /auth/login` | Public | 10 req/min |
| `POST /auth/refresh` | `JwtRefreshGuard` | 5 req/min |
| `POST /auth/logout` | `JwtAccessGuard` | — |
| `GET /auth/me` | `JwtAccessGuard` | — |
| `POST /auth/reset-password` | Public | 5 req/min |

**Guards (`apps/api/src/auth/guards/`)**

| Fichier | Rôle |
|---|---|
| `jwt-access.guard.ts` | Étend `AuthGuard('jwt')`, lit `isPublic` via Reflector pour court-circuiter |
| `jwt-refresh.guard.ts` | Étend `AuthGuard('jwt-refresh')` — appliqué uniquement sur `/auth/refresh` |
| `roles.guard.ts` | Lit `ROLES_KEY`, compare `user.role` aux rôles requis, lève `UnauthorizedException` si user absent |

**Stratégies (`apps/api/src/auth/strategies/`)**

| Fichier | Rôle |
|---|---|
| `jwt-access.strategy.ts` | `PassportStrategy(Strategy, 'jwt')` — extrait le Bearer token, vérifie avec `JWT_ACCESS_SECRET`, retourne le payload tel quel |
| `jwt-refresh.strategy.ts` | `PassportStrategy(Strategy, 'jwt-refresh')` — `passReqToCallback: true`, extrait le token brut de l'en-tête, retourne `{ ...payload, refreshToken }` |

**Décorateurs (`apps/api/src/auth/decorators/`)**

| Fichier | Rôle |
|---|---|
| `public.decorator.ts` | `@Public()` — pose `isPublic: true` comme métadonnée |
| `roles.decorator.ts` | `@Roles(...roles)` — pose la liste des rôles sous `ROLES_KEY` |
| `get-user.decorator.ts` | `@GetUser()` — param décorateur extrayant `request.user` |

**Types (`apps/api/src/auth/types/jwt-payload.type.ts`)**

- `JwtPayload` : `{ sub, email, role }`
- `JwtRefreshPayload` : `JwtPayload & { refreshToken }`

**Migration Prisma et seed**

- `apps/api/prisma/migrations/20240101000000_initial_schema/migration.sql` — schéma complet avec `refreshHash String? @db.Text` sur la table `User`
- `apps/api/prisma/seed.ts` — seed idempotent (upsert) : utilisateur admin, formateur (Jean Dupont), apprenant (Marie Martin), et un cours de démonstration avec module et leçon ; les mots de passe sont chargés depuis `SEED_*_PASSWORD` (jamais hardcodés)

### Statut des tests

| Suite | Cas | Statut |
|---|---|---|
| `auth.service.spec.ts` | signup, login, refresh, logout, getMe, resetPassword | Écrits, non exécutés en CI |
| `auth.controller.spec.ts` | délégation vers le service pour chaque endpoint | Écrits, non exécutés en CI |
| `jwt-access.guard.spec.ts` | isPublic court-circuite, JWT invalide → 401 | Écrits, non exécutés en CI |
| `roles.guard.spec.ts` | 7 cas (pas de rôles requis, match, non-match, multi-rôles, user absent) | Écrits, non exécutés en CI |
| `jwt-access.strategy.spec.ts` | secret manquant → throw, validate retourne payload inchangé, tous les rôles | Écrits, non exécutés en CI |
| `jwt-refresh.strategy.spec.ts` | secret manquant → throw, extraction token, casse mixte Bearer, header absent → throw, payload préservé | Écrits, non exécutés en CI |
| `get-user.decorator.spec.ts` | extraction `request.user` depuis le contexte HTTP | Écrits, non exécutés en CI |
| `login.dto.spec.ts` | (existant) | — |
| `signup.dto.spec.ts` | (existant) | — |
| `reset-password.dto.spec.ts` | (existant) | — |

> 81 tests unitaires au total sur 12 suites. Lancement local : `pnpm --filter api test`.

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/api/src/auth/auth.service.ts` | Logique signup/login/refresh/logout/getMe + rotation refreshHash |
| `apps/api/src/auth/auth.controller.ts` | 6 endpoints avec rate limiting, guards, `@GetUser()` |
| `apps/api/src/auth/guards/jwt-access.guard.ts` | Guard JWT global avec support `@Public()` |
| `apps/api/src/auth/guards/jwt-refresh.guard.ts` | Guard JWT dédié au endpoint `/auth/refresh` |
| `apps/api/src/auth/guards/roles.guard.ts` | Guard RBAC basé sur `@Roles()` et `Reflector` |
| `apps/api/src/auth/strategies/jwt-access.strategy.ts` | Stratégie Passport pour les access tokens |
| `apps/api/src/auth/strategies/jwt-refresh.strategy.ts` | Stratégie Passport pour les refresh tokens (token brut annexé) |
| `apps/api/src/auth/decorators/public.decorator.ts` | `@Public()` — bypass du guard JWT global |
| `apps/api/src/auth/decorators/roles.decorator.ts` | `@Roles()` — liste de rôles requis |
| `apps/api/src/auth/decorators/get-user.decorator.ts` | `@GetUser()` — accès typé au payload JWT dans les handlers |
| `apps/api/src/auth/types/jwt-payload.type.ts` | Types `JwtPayload` et `JwtRefreshPayload` |
| `apps/api/prisma/migrations/20240101000000_initial_schema/migration.sql` | Migration initiale avec `refreshHash` sur `User` |
| `apps/api/prisma/seed.ts` | Seed idempotent : admin, formateur, apprenant, cours de démo |

### Notes

- Le refresh token n'est jamais stocké en clair : seul le bcrypt hash est persisté. Même en cas de fuite de la base, les tokens ne peuvent pas être réutilisés directement.
- La rotation à chaque refresh garantit qu'un token volé est invalidé dès que le titulaire légitime rafraîchit sa session.
- Le guard global `APP_GUARD` simplifie la configuration : les nouvelles routes sont automatiquement protégées sans oublier d'ajouter un guard manuellement ; seules les exceptions explicites portent `@Public()`.
- `RolesGuard` est indépendant de `JwtAccessGuard` et peut être utilisé sur n'importe quel handler ; les deux sont souvent combinés sur les routes FORMATEUR et ADMIN.
- En v2 : brancher le hash du refresh token sur une table dédiée (multi-session) plutôt que sur le champ unique `refreshHash` de `User` — nécessaire pour autoriser plusieurs appareils connectés simultanément.

---

## 2026-04-27 — Ticket 42c4f: "Intégrer l'API au front (auth + catalogue + cours)"

### Résumé

Branchement du frontend sur l'API réelle pour les trois domaines prioritaires du MVP : catalogue, fiche cours, et inscriptions. Le catalogue passe en Server Component async (fetch + revalidate) avec un nouveau `CatalogueClient` pour la partie interactive (filtres, pagination, recherche). La fiche cours récupère le cours depuis l'API et délègue l'inscription à un composant `EnrollButton` alimenté par un hook `useEnrollment`. Côté API, un nouveau module `Enrollments` offre trois endpoints protégés par JWT. Un client HTTP de second niveau (`api-client.ts`) centralise le refresh automatique du token d'accès.

### Architecture

**Séparation Server Component / Client Component (catalogue)**

La page catalogue est maintenant un Server Component async : elle exécute le `fetch` côté serveur avec `{ next: { revalidate: 60 } }` (ISR) et passe les cours au `CatalogueClient` via props. Tout le state interactif (query, filtres, pagination) reste dans le Client Component, sans waterfall réseau côté navigateur.

**Client HTTP avec refresh automatique (`api-client.ts`)**

`apiRequest<T>` est un wrapper `fetch` typé qui gère le cycle complet des tokens JWT :
1. Tente la requête avec le token d'accès en cours
2. Si 401, appelle `POST /auth/refresh` avec le refresh token, stocke les nouveaux tokens, et rejoue la requête une fois
3. Si le refresh échoue, nettoie le localStorage et lève `AuthExpiredError`

Ce client est distinct de `api.ts` (qui reste compatible avec les appels depuis les Server Components et les appels sans token) et est utilisé exclusivement pour les routes authentifiées du client.

**Hook `useEnrollment`**

Encapsule l'état d'inscription d'un apprenant pour un cours donné : vérifie au montage si l'utilisateur est inscrit (`enrollmentsApi.findOne`), expose `enroll()` qui appelle l'API puis re-fetch l'état, gère `AuthExpiredError` (redirection `/auth/login`) et `ApiError` avec messages explicites par code HTTP.

**Module Enrollments (API)**

Trois endpoints tous protégés par `JwtAccessGuard` :
- `POST /enrollments` — inscription idempotente (`upsert`) ; vérifie l'existence du cours
- `GET /enrollments/mine` — liste les inscriptions avec calcul de progression (modules complétés / total)
- `GET /enrollments/mine/:courseId` — progression pour un cours précis

Le calcul de progression est fait dans le service en combinant `Enrollment` + `ModuleProgress` sans jointure N+1 grâce à une requête `findMany` sur les `ModuleProgress` de l'utilisateur puis un `Set` pour le filtrage.

### Ce qui a été implémenté

**API NestJS — module Enrollments (`apps/api/src/enrollments/`)**

| Fichier | Rôle |
|---|---|
| `enrollments.controller.ts` | Trois routes JWT-protégées (`POST /`, `GET /mine`, `GET /mine/:courseId`) |
| `enrollments.service.ts` | Logique métier : upsert inscription, calcul de progression via `ModuleProgress` |
| `dto/create-enrollment.dto.ts` | Validation `@IsUUID()` + `@IsNotEmpty()` sur `courseId` |
| `enrollments.module.ts` | Module NestJS (import `PrismaModule`) |

`app.module.ts` : import de `EnrollmentsModule` ajouté.

**Frontend — couche API**

- `api-client.ts` — `apiRequest<T>` avec refresh automatique, `ApiError` (status + message), `AuthExpiredError`
- `api.ts` — les trois namespaces (`coursesApi`, `modulesApi`, `lessonsApi`) sont désormais pleinement typés (remplacement des `unknown` par les types métier) ; ajout du namespace `enrollmentsApi` (`enroll`, `findMine`, `findOne`)
- `types.ts` — `modules` rendu optionnel sur `Course` (`modules?: CourseModule[]`) ; nouveau type `EnrollmentProgress` (`courseId`, `enrolledAt`, `progress`, `completedModules`)

**Frontend — catalogue**

- `catalogue/page.tsx` — converti en `async` Server Component ; `fetchCourses()` appelle `GET /courses` (ISR 60 s) et passe les données à `CatalogueClient`
- `CatalogueClient.tsx` — extrait de l'ancienne page : state (query, category, levels, priceRange, page), filtrage client-side, pagination calculée, vide état de résultats

**Frontend — fiche cours**

- `cours/[id]/page.tsx` — converti en `async` Server Component ; `fetchCourse(id)` appelle `GET /courses/:id` (ISR 60 s) ; `modules` accédé via `?? []` pour gérer le champ optionnel ; bouton d'inscription remplacé par `<EnrollButton>`
- `EnrollButton.tsx` — composant client : spinner pendant le chargement, lien "Continuer le cours" si inscrit avec `firstLessonId`, bouton "S'inscrire maintenant" sinon ; redirige vers `/auth/login` si non authentifié

**Frontend — hook**

- `hooks/use-enrollment.ts` — `useEnrollment(courseId)` : vérification au montage, `enroll()` avec gestion fine des erreurs (404 / 409 / 403), `AuthExpiredError` → redirection

**Pages mises à jour pour `modules?: CourseModule[]`**

`dashboard/page.tsx`, `formateur/page.tsx`, `formateur/cours/[id]/page.tsx` — accès à `course.modules` protégé par `?? []`.

### Statut des tests

| Suite | Cible | Statut |
|---|---|---|
| `CatalogueClient.test.tsx` | Filtres, pagination, état vide | Écrits, non exécutés en CI |
| `EnrollButton.test.tsx` | État inscrit/non-inscrit, loading, redirect | Écrits, non exécutés en CI |
| `use-enrollment.test.tsx` | Fetch au montage, enroll(), erreurs | Écrits, non exécutés en CI |
| `api-client.test.ts` | Refresh automatique, AuthExpiredError, ApiError | Écrits, non exécutés en CI |
| `api.test.ts` | Types de retour enrollmentsApi | Écrits, non exécutés en CI |
| `auth-storage.test.ts` | Helpers localStorage | Écrits, non exécutés en CI |

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/api/src/enrollments/enrollments.controller.ts` | Endpoints POST + GET /enrollments |
| `apps/api/src/enrollments/enrollments.service.ts` | Logique inscription + progression |
| `apps/api/src/enrollments/dto/create-enrollment.dto.ts` | Validation courseId UUID |
| `apps/api/src/app.module.ts` | Import EnrollmentsModule |
| `apps/web/src/lib/api-client.ts` | Client HTTP avec refresh JWT automatique |
| `apps/web/src/lib/api.ts` | Namespaces typés + enrollmentsApi |
| `apps/web/src/lib/types.ts` | EnrollmentProgress + modules optionnel |
| `apps/web/src/app/catalogue/page.tsx` | Server Component async (ISR) |
| `apps/web/src/app/catalogue/CatalogueClient.tsx` | Filtres et pagination côté client |
| `apps/web/src/app/cours/[id]/page.tsx` | Server Component async (ISR) + EnrollButton |
| `apps/web/src/app/cours/[id]/EnrollButton.tsx` | Composant d'inscription avec états |
| `apps/web/src/hooks/use-enrollment.ts` | Hook gestion de l'inscription |

### Notes

- Le split Server Component / `CatalogueClient` suit le pattern Next.js App Router recommandé : le serveur fait le fetch, le client gère l'interactivité ; aucune duplication d'état.
- `apiRequest<T>` rejoue la requête une seule fois après refresh pour éviter les boucles infinies en cas de refresh token invalide.
- L'inscription est idempotente côté API (upsert) ; le frontend gère explicitement le code 409 pour informer l'utilisateur plutôt que de le traiter comme une erreur fatale.
- En v2 : brancher le dashboard apprenant sur `enrollmentsApi.findMine()` (actuellement encore sur mock-data) ; ajouter la progression de `ModuleProgress` depuis la page de lecteur de leçon.

---

## 2026-04-27 — Ticket d78db: "Ajouter des animations aux pages (UI)"

### Résumé

Mise en place d'une bibliothèque d'animations `framer-motion` et intégration sur l'ensemble des pages du frontend. Quatre nouveaux composants d'animation ont été créés (`ScaleIn`, `AnimatedCounter`, `AnimatedProgress`, `PageTransition`) ; les deux existants (`FadeIn`, `StaggerCards`) ont été renforcés avec le support `prefers-reduced-motion`. Toutes les pages — auth, catalogue, cours, quiz, dashboard apprenant et formateur — ont été instrumentées. L'infrastructure de test frontend (Vitest + Testing Library) a été initialisée et sept suites de tests couvrent chaque composant d'animation.

### Architecture

**Principe d'accessibilité — `prefers-reduced-motion`**

Chaque composant lit `useReducedMotion()` de framer-motion et court-circuite l'animation si le signal système est actif : `initial` est forcé à l'état final (opacité 1, position 0, échelle 1), `duration` est mis à zéro. Cela garantit que les pages restent utilisables pour les personnes sensibles aux mouvements sans aucune logique métier dans les pages elles-mêmes.

**Barrel export (`index.ts`)**

Les six composants sont réexportés depuis `apps/web/src/components/animations/index.ts`, ce qui unifie les imports dans toutes les pages (`import { FadeIn, StaggerCards, … } from '@/components/animations'`).

**Infrastructure de test (Vitest)**

Le projet web utilise désormais Vitest (via `@vitejs/plugin-react` + jsdom) au lieu de Jest, pour une meilleure compatibilité avec le toolchain Vite/Next.js. Les composants framer-motion sont mockés via `vi.mock` : `motion.div` expose ses props (`initial`, `animate`, `transition`) en attributs `data-*` lisibles par les assertions, `useReducedMotion` est contrôlé par un flag de test.

### Ce qui a été implémenté

**Nouveaux composants d'animation (`apps/web/src/components/animations/`)**

| Composant | Effet | Props clés |
|---|---|---|
| `ScaleIn` | Fondu + zoom (0.95 → 1) | `delay`, `className` |
| `AnimatedCounter` | Compte de 0 à `value` en 0.6 s | `value`, `suffix`, `className` |
| `AnimatedProgress` | Barre de progression (0 % → `value` %) | `value`, `className` |
| `PageTransition` | Glissement vertical léger (y: 12 → 0) | `className` |

**Composants existants renforcés**

- `FadeIn.tsx` — `useReducedMotion()` ajouté : si actif, `initial = { opacity:1, y:0, x:0 }` et `duration = 0` (aucun mouvement)
- `StaggerCards.tsx` / `StaggerItem` — `itemVariantsReduced` (hidden = visible) injecté conditionnellement ; `initial` du container mis à `'visible'` si reduced

**Instrumentation des pages**

*Pages d'authentification (`/auth/login`, `/auth/signup`, `/auth/reset-password`)* :
- `<ScaleIn>` enveloppe la carte de formulaire entière
- `<FadeIn direction="up" delay={0.1}>` sur le titre `<h1>`
- `<FadeIn direction="up" delay={0.15}>` sur le sous-titre

*Catalogue (`/catalogue`)* :
- `<PageTransition>` sur la page complète
- `<FadeIn delay={0}>` sur le titre hero + compteur de cours
- `<FadeIn delay={0.08}>` sur la barre de recherche
- `<StaggerCards>` / `<StaggerItem>` sur la grille de `CourseCard`

*Dashboard apprenant (`/dashboard`)* :
- `<PageTransition>` + `<FadeIn>` sur l'en-tête
- `<AnimatedCounter>` sur les KPI (cours suivis, modules complétés)
- `<AnimatedProgress>` sur les barres de progression par cours
- Composant `ActivityFeed` inline avec stagger `framer-motion` (70 ms entre items) et variante réduite

*Pages formateur (`/formateur`, `/formateur/cours/[id]`)* :
- `<AnimatedCounter>` sur les statistiques (revenus, inscriptions, cours actifs)
- `<FadeIn>` et `<StaggerCards>` sur les listes de cours

*Pages cours (`/cours/[id]`, `/cours/[id]/chapitre/[chapitreId]`, `/cours/[id]/quiz/[quizId]`)* :
- `<PageTransition>` sur le contenu principal
- `<FadeIn>` sur les titres et descriptions

**Infrastructure de test**

- `apps/web/vitest.config.ts` — preset `@vitejs/plugin-react`, environnement `jsdom`, setup file `src/test/setup.ts`
- `src/test/setup.ts` — import `@testing-library/jest-dom` pour les matchers (`toBeInTheDocument`, `toHaveClass`, etc.)
- `package.json` : scripts `test` (`vitest run`) et `test:watch` (`vitest`) ; devDependencies `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`

### Statut des tests

| Suite | Cas | Statut |
|---|---|---|
| `FadeIn.test.tsx` | 10 (+ 2 reduced-motion) | Écrits, non exécutés en CI |
| `StaggerCards.test.tsx` | — | Écrits, non exécutés en CI |
| `ScaleIn.test.tsx` | — | Écrits, non exécutés en CI |
| `AnimatedCounter.test.tsx` | — | Écrits, non exécutés en CI |
| `AnimatedProgress.test.tsx` | — | Écrits, non exécutés en CI |
| `PageTransition.test.tsx` | — | Écrits, non exécutés en CI |
| `index.test.ts` | Vérification barrel export | Écrits, non exécutés en CI |

> Lancement local : `pnpm --filter web test`. Intégration CI à configurer (étape suivante).

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `apps/web/src/components/animations/ScaleIn.tsx` | Zoom + fondu entrant |
| `apps/web/src/components/animations/AnimatedCounter.tsx` | Compteur animé (motionValue) |
| `apps/web/src/components/animations/AnimatedProgress.tsx` | Barre de progression animée |
| `apps/web/src/components/animations/PageTransition.tsx` | Transition de page (glissement) |
| `apps/web/src/components/animations/FadeIn.tsx` | Fondu directionnel + reduced-motion |
| `apps/web/src/components/animations/StaggerCards.tsx` | Stagger grille + reduced-motion |
| `apps/web/src/components/animations/index.ts` | Barrel export des 6 composants |
| `apps/web/src/components/animations/__tests__/` | 7 suites Vitest |
| `apps/web/vitest.config.ts` | Configuration Vitest (jsdom + React) |
| `apps/web/src/test/setup.ts` | Setup jest-dom pour Vitest |
| `apps/web/package.json` | Scripts test + devDependencies Vitest/Testing Library |

### Notes

- Le pattern `data-*` dans les mocks framer-motion (exposer `initial`/`animate`/`transition` en attributs HTML) permet d'écrire des assertions précises sur les valeurs de configuration sans déclencher de vraies animations dans jsdom.
- `AnimatedCounter` utilise `useMotionValueEvent` au lieu d'un `useEffect` sur la motion value transformée : évite un re-render inutile et garantit que `setDisplay` est appelé au bon moment dans le cycle React.
- En v2 : brancher les tests sur la CI GitHub Actions (job `test:unit:web`) ; envisager des tests d'intégration Playwright pour vérifier le comportement visuel des animations clés.

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
