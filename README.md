# ScriptVerse

Plateforme d'apprentissage en ligne – monorepo pnpm.

## Structure

```
scriptverse/
├── apps/
│   ├── web/          # Next.js 14 – interface apprenant & formateur (port 3001)
│   └── api/          # NestJS 10 – API REST + Auth JWT (port 3000)
├── packages/
│   ├── eslint-config/    # Configs ESLint partagées (base / next / nest)
│   ├── tsconfig/         # Configs TypeScript partagées (base / nextjs / nestjs)
│   └── prettier-config/  # Config Prettier partagée
├── package.json          # Workspace root
└── pnpm-workspace.yaml
```

## Prérequis

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9 — `npm install -g pnpm`
- [PostgreSQL](https://www.postgresql.org/) >= 15

## Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/t1driss4/scriptverse-repos.git
cd scriptverse-repos

# 2. Installer les dépendances (toutes les apps + packages)
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env : DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 4. Initialiser la base de données
pnpm --filter @scriptverse/api prisma:migrate:dev

# 5. Lancer les deux apps en parallèle
pnpm dev
```

L'API est disponible sur `http://localhost:3000`, le frontend sur `http://localhost:3001`.

## Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Démarre toutes les apps en mode développement |
| `pnpm build` | Compile toutes les apps |
| `pnpm lint` | Lint sur tous les packages |
| `pnpm format` | Formate le code avec Prettier |
| `pnpm format:check` | Vérifie le formatage sans modifier |
| `pnpm type-check` | Vérification TypeScript sur tous les packages |
| `pnpm --filter @scriptverse/api <script>` | Exécuter un script uniquement sur l'API |
| `pnpm --filter @scriptverse/web <script>` | Exécuter un script uniquement sur le frontend |

### Prisma (API)

```bash
pnpm --filter @scriptverse/api prisma:migrate:dev   # Nouvelle migration
pnpm --filter @scriptverse/api prisma:generate       # Regénérer le client
pnpm --filter @scriptverse/api prisma:studio         # Ouvrir Prisma Studio
```

## Conventions de commit

Ce projet suit la spécification [Conventional Commits](https://www.conventionalcommits.org/fr/).

```
<type>(<scope>): <description courte>

[corps optionnel]

[pied de page optionnel]
```

### Types autorisés

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage (pas de changement logique) |
| `refactor` | Refactoring (ni feat ni fix) |
| `perf` | Amélioration des performances |
| `test` | Ajout ou modification de tests |
| `chore` | Maintenance (build, config, dépendances) |
| `ci` | Changements CI/CD |
| `revert` | Annulation d'un commit précédent |

### Exemples

```bash
git commit -m "feat(auth): add refresh token rotation"
git commit -m "fix(web): correct broken link on login page"
git commit -m "chore(deps): upgrade next.js to 14.3"
```

### Git hooks (commitlint + husky)

Les hooks sont initialisés automatiquement via `pnpm install` (script `prepare`).
Pour ajouter le hook de validation des messages de commit manuellement :

```bash
# Après pnpm install, husky initialise .husky/
echo 'npx --no-install commitlint --edit "$1"' > .husky/commit-msg
chmod +x .husky/commit-msg

# Hook optionnel : vérification du formatage avant commit
echo 'pnpm run format:check' > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Variables d'environnement

Copier `.env.example` vers `.env` et renseigner les valeurs :

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/scriptverse` |
| `JWT_ACCESS_SECRET` | Secret pour les access tokens | chaîne aléatoire longue |
| `JWT_ACCESS_EXPIRES_IN` | Durée de vie des access tokens | `15m` |
| `JWT_REFRESH_SECRET` | Secret pour les refresh tokens | chaîne aléatoire longue |
| `JWT_REFRESH_EXPIRES_IN` | Durée de vie des refresh tokens | `7d` |
| `PORT` | Port de l'API | `3000` |

## Architecture

### `apps/api` — NestJS REST API

- **Auth** : JWT (access + refresh tokens), bcrypt, Passport
- **Base de données** : PostgreSQL via Prisma ORM
- **Validation** : `class-validator` + `class-transformer`
- **Modules** : `AuthModule`, `PrismaModule`

### `apps/web` — Next.js Frontend

- **Framework** : Next.js 14 avec App Router
- **Styles** : Tailwind CSS avec palette de couleurs personnalisée
- **Langue** : TypeScript strict
- **Pages** : authentification, catalogue, cours, dashboard apprenant & formateur

### `packages/` — Packages partagés

- **`@scriptverse/tsconfig`** : configurations TypeScript de base, Next.js et NestJS
- **`@scriptverse/eslint-config`** : règles ESLint pour TypeScript, Next.js et NestJS
- **`@scriptverse/prettier-config`** : règles Prettier communes

## Contribuer

1. Créer une branche depuis `main` : `git checkout -b feat/ma-fonctionnalite`
2. Développer et tester localement
3. S'assurer que `pnpm lint` et `pnpm type-check` passent
4. Commiter en respectant les conventions : `git commit -m "feat(scope): description"`
5. Ouvrir une Pull Request vers `main`
