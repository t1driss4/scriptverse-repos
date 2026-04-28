# ScriptVerse — Architecture Specifications

## Feature: Auth — Refresh Token + Guards / RBAC

---

## 1. Overview

Authentication uses **two short-lived JWT tokens** (access + refresh) with bcrypt-hashed
refresh tokens stored in the database.  
Authorization is enforced by **NestJS guards** (`JwtAccessGuard`, `RolesGuard`) and a
`@Roles()` decorator that implements RBAC based on the `Role` Prisma enum.

---

## 2. Roles

Defined in `prisma/schema.prisma` as an enum and embedded in every JWT payload.

| Role        | Description                              |
|-------------|------------------------------------------|
| `APPRENANT` | Default learner — read/enroll only       |
| `FORMATEUR` | Instructor — create/manage own courses   |
| `ADMIN`     | Full platform access                     |

---

## 3. Prisma Schema — Auth-relevant fields

```prisma
// prisma/schema.prisma

enum Role {
  APPRENANT
  FORMATEUR
  ADMIN
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  firstName    String?
  lastName     String?
  avatar       String?
  role         Role     @default(APPRENANT)
  /// Bcrypt hash of the current refresh token (null when logged out)
  refreshHash  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

Key invariant: `refreshHash` is `null` when the user is logged out, making the refresh
endpoint stateful and revocable without a token blacklist.

---

## 4. Folder Structure

```
apps/api/src/
│
├── main.ts                                  # Bootstrap: helmet, CORS, ValidationPipe, required-env check
├── app.module.ts                            # Root module — global APP_GUARD: ThrottlerGuard, JwtAccessGuard
│
├── auth/
│   ├── auth.controller.ts                   # HTTP endpoints (signup, login, refresh, logout, me, reset-password)
│   ├── auth.controller.spec.ts
│   ├── auth.module.ts                       # NestJS module wiring
│   ├── auth.service.ts                      # Business logic (issueTokens, storeRefreshHash, …)
│   ├── auth.service.spec.ts
│   │
│   ├── decorators/
│   │   ├── get-user.decorator.ts            # @GetUser() — extracts req.user or a specific field
│   │   ├── get-user.decorator.spec.ts
│   │   ├── public.decorator.ts              # @Public() — skips global JwtAccessGuard for a route
│   │   └── roles.decorator.ts               # @Roles(...roles) — sets ROLES_KEY metadata
│   │
│   ├── dto/
│   │   ├── login.dto.ts                     # { email, password }
│   │   ├── login.dto.spec.ts
│   │   ├── signup.dto.ts                    # { email, password, role? }
│   │   ├── signup.dto.spec.ts
│   │   ├── reset-password.dto.ts            # { email }
│   │   └── reset-password.dto.spec.ts
│   │
│   ├── guards/
│   │   ├── jwt-access.guard.ts              # Extends AuthGuard('jwt'); honours @Public()
│   │   ├── jwt-access.guard.spec.ts
│   │   ├── jwt-refresh.guard.ts             # Extends AuthGuard('jwt-refresh')
│   │   ├── roles.guard.ts                   # Checks @Roles() metadata against req.user.role
│   │   └── roles.guard.spec.ts
│   │
│   ├── strategies/
│   │   ├── jwt-access.strategy.ts           # Validates Bearer token, returns JwtPayload
│   │   ├── jwt-access.strategy.spec.ts
│   │   ├── jwt-refresh.strategy.ts          # Validates refresh token, appends raw token to payload
│   │   └── jwt-refresh.strategy.spec.ts
│   │
│   └── types/
│       └── jwt-payload.type.ts              # JwtPayload, JwtRefreshPayload
│
├── courses/
│   ├── courses.controller.ts                # Public list/detail; FORMATEUR-guarded create/update/delete
│   ├── courses.module.ts
│   ├── courses.service.ts
│   └── dto/
│       ├── create-course.dto.ts
│       └── update-course.dto.ts
│
├── modules/
│   ├── modules.controller.ts                # Nested under /courses/:courseId; FORMATEUR-guarded mutations
│   ├── modules.module.ts
│   ├── modules.service.ts
│   └── dto/
│       ├── create-module.dto.ts
│       └── update-module.dto.ts
│
├── lessons/
│   ├── lessons.controller.ts                # Nested under /modules/:moduleId; FORMATEUR-guarded mutations
│   ├── lessons.module.ts
│   ├── lessons.service.ts
│   └── dto/
│       ├── create-lesson.dto.ts
│       └── update-lesson.dto.ts
│
├── enrollments/
│   ├── enrollments.controller.ts            # APPRENANT-only enroll; authenticated list
│   ├── enrollments.module.ts
│   ├── enrollments.service.ts
│   └── dto/
│       └── create-enrollment.dto.ts
│
├── users/
│   ├── users.controller.ts                  # Admin-only routes: list users, update role
│   ├── users.controller.spec.ts
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.service.spec.ts
│   └── dto/
│       └── update-role.dto.ts               # { role: Role }
│
└── prisma/
    ├── prisma.module.ts                     # @Global() module — exports PrismaService
    └── prisma.service.ts                    # PrismaClient lifecycle (onModuleInit / onModuleDestroy)
```

---

## 5. Token Lifecycle

```
POST /auth/signup  ─┐
POST /auth/login   ─┴──▶  issueTokens()  ──▶  { accessToken (15m), refreshToken (7d) }
                                                        │
                                           storeRefreshHash() — bcrypt(refreshToken) → DB

POST /auth/refresh  ◀── Bearer <refreshToken>
  1. JwtRefreshStrategy validates signature
  2. AuthService.refresh(): bcrypt.compare(token, user.refreshHash)
  3. Re-issue both tokens + rotate hash

POST /auth/logout   ◀── Bearer <accessToken>
  AuthService.logout(): user.refreshHash = null
```

---

## 6. Guards & RBAC

### Global Guard Pattern

`JwtAccessGuard` is registered as a global guard via `APP_GUARD` in `AppModule`.  
Every route is protected by default; individual routes opt out with `@Public()`.

```
Request
  └── JwtAccessGuard (global, via APP_GUARD)
        │ if @Public() → pass through unauthenticated
        └── validates signature + expiry via passport-jwt
              └── RolesGuard  (reads @Roles() metadata, checks user.role)
                    └── Route handler
```

### Public Routes

```typescript
// Marks a route as public — JwtAccessGuard skips JWT validation
@Public()
@Post('signup')
signup(@Body() dto: SignupDto) { … }
```

`@Public()` sets a `IS_PUBLIC_KEY` metadata flag that `JwtAccessGuard` checks via
`Reflector` before calling `super.canActivate()`.

### Protected Routes with RBAC

`RolesGuard` is applied per-controller or per-handler alongside `@Roles()`.
`JwtAccessGuard` (global) must already have populated `req.user` for `RolesGuard` to work.

```typescript
@Post()
@UseGuards(RolesGuard)
@Roles(Role.FORMATEUR)
create(@GetUser('sub') userId: string, @Body() dto: CreateCourseDto) { … }
```

For the admin module, the guard pair is applied at controller level:

```typescript
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class UsersController { … }
```

### RolesGuard Logic

- No `@Roles()` on the handler → guard returns `true` (authenticated is sufficient).
- At least one role listed → `requiredRoles.some(r => user.role === r)`.

---

## 7. JWT Payload Types

```typescript
// src/auth/types/jwt-payload.type.ts

type JwtPayload = {
  sub: string;   // user UUID
  email: string;
  role: Role;
};

type JwtRefreshPayload = JwtPayload & {
  refreshToken: string;  // raw token — for bcrypt comparison in AuthService
};
```

---

## 8. Environment Variables

| Variable                  | Default           | Purpose                                        |
|---------------------------|-------------------|------------------------------------------------|
| `JWT_ACCESS_SECRET`       | —                 | Signs/verifies access tokens                   |
| `JWT_ACCESS_EXPIRES_IN`   | `15m`             | Access token TTL                               |
| `JWT_REFRESH_SECRET`      | —                 | Signs/verifies refresh tokens                  |
| `JWT_REFRESH_EXPIRES_IN`  | `7d`              | Refresh token TTL                              |
| `DATABASE_URL`            | —                 | PostgreSQL connection string                   |
| `FRONTEND_URL`            | —                 | Allowed CORS origin for the web client         |
| `PORT`                    | `3000`            | Port the API listens on                        |
| `SEED_ADMIN_PASSWORD`     | `Admin1234!`      | Password for seeded admin account              |
| `SEED_FORMATEUR_PASSWORD` | `Formateur1234!`  | Password for seeded instructor account         |
| `SEED_APPRENANT_PASSWORD` | `Apprenant1234!`  | Password for seeded learner account            |

Hard-required at startup (`main.ts` exits with code 1 if missing): `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`. Seed password variables are
only read by `prisma/seed.ts`; they have safe defaults for local development but should be
overridden in any shared environment.

---

## 9. RBAC Matrix — Current Routes

`JwtAccessGuard` is global. `@Public()` = no JWT required. `RolesGuard` is applied
explicitly per controller/handler where role enforcement is needed.

| Route                                   | Public? | RolesGuard | Required Role              |
|-----------------------------------------|---------|------------|----------------------------|
| `POST /auth/signup`                     | ✓       | —          | public                     |
| `POST /auth/login`                      | ✓       | —          | public                     |
| `POST /auth/refresh`                    | ✓ (`JwtRefreshGuard`) | — | authenticated (refresh token) |
| `POST /auth/logout`                     | —       | —          | authenticated              |
| `GET  /auth/me`                         | —       | —          | authenticated              |
| `POST /auth/reset-password`             | ✓       | —          | public                     |
| `GET  /courses`                         | ✓       | —          | public                     |
| `GET  /courses/:id`                     | ✓       | —          | public                     |
| `POST /courses`                         | —       | ✓          | `FORMATEUR`                |
| `GET  /courses/mine`                    | —       | ✓          | `FORMATEUR`                |
| `PATCH /courses/:id`                    | —       | ✓          | `FORMATEUR` (owner)        |
| `DELETE /courses/:id`                   | —       | ✓          | `FORMATEUR` (owner)        |
| `POST /courses/:courseId/modules`       | —       | ✓          | `FORMATEUR` (course owner) |
| `GET  /courses/:courseId/modules`       | ✓       | —          | public                     |
| `GET  /modules/:id`                     | ✓       | —          | public                     |
| `PATCH /modules/:id`                    | —       | ✓          | `FORMATEUR` (course owner) |
| `DELETE /modules/:id`                   | —       | ✓          | `FORMATEUR` (course owner) |
| `POST /modules/:moduleId/lessons`       | —       | ✓          | `FORMATEUR` (course owner) |
| `GET  /modules/:moduleId/lessons`       | ✓       | —          | public                     |
| `GET  /lessons/:id`                     | ✓       | —          | public                     |
| `PATCH /lessons/:id`                    | —       | ✓          | `FORMATEUR` (course owner) |
| `DELETE /lessons/:id`                   | —       | ✓          | `FORMATEUR` (course owner) |
| `POST /enrollments`                     | —       | ✓          | `APPRENANT`                |
| `GET  /enrollments/mine`                | —       | —          | authenticated              |
| `GET  /enrollments/mine/:courseId`      | —       | —          | authenticated              |
| `GET  /admin/users`                     | —       | ✓          | `ADMIN`                    |
| `PATCH /admin/users/:id/role`           | —       | ✓          | `ADMIN`                    |

---

## 10. Security Notes

- **Refresh token rotation**: every `/auth/refresh` call issues a new pair and overwrites `refreshHash`. Reuse of an old refresh token fails (bcrypt mismatch).
- **Logout is revocation**: setting `refreshHash = null` invalidates any outstanding refresh token immediately.
- **No access token revocation**: access tokens are stateless and valid until expiry (15 min). Shorten TTL if stricter revocation is needed.
- **Bcrypt cost**: `SALT_ROUNDS = 10` for both password and refresh-token hashes.
- **Separate secrets**: access and refresh tokens use distinct secrets; a leaked refresh secret cannot be used to forge access tokens and vice-versa.

---

## 11. Admin User Management

The `UsersModule` (`src/users/`) exposes admin-only CRUD over user roles.
The entire controller is locked to `ADMIN` via `RolesGuard` at the controller level.

```
GET  /admin/users            → UsersService.findAll()         — returns all users (no passwordHash/refreshHash)
PATCH /admin/users/:id/role  → UsersService.updateRole(id, role) — updates role field
```

`UpdateRoleDto` validates that the supplied `role` is a valid `Role` enum value, preventing
arbitrary strings from reaching the database.

---

## 12. Rate Limiting

`@nestjs/throttler` is configured globally in `AppModule`. Individual auth endpoints apply
tighter per-route limits via `@Throttle()`:

| Endpoint              | Limit         |
|-----------------------|---------------|
| `POST /auth/signup`   | 5 req / min   |
| `POST /auth/login`    | 10 req / min  |
| `POST /auth/refresh`  | 5 req / min   |
| `POST /auth/reset-password` | 5 req / min |

Routes without an explicit `@Throttle()` inherit the global default.

---

## 13. Seed Data

`prisma/seed.ts` is wired to `prisma.seed` in `package.json` and run with:

```bash
pnpm --filter @scriptverse/api prisma:seed
```

It creates three demo accounts (passwords configurable via env vars — see §8) and one
published free course with two modules, four lessons, and a quiz:

| Account                        | Role        | Default password   |
|--------------------------------|-------------|---------------------|
| `admin@scriptverse.dev`        | `ADMIN`     | `Admin1234!`        |
| `formateur@scriptverse.dev`    | `FORMATEUR` | `Formateur1234!`    |
| `apprenant@scriptverse.dev`    | `APPRENANT` | `Apprenant1234!`    |

The seed is idempotent: it uses `upsert` so it can be re-run without creating duplicates.

---

---

## Feature: DB — Schéma initial + Migrations (PostgreSQL + Prisma)

---

## 14. Overview

The database layer uses **PostgreSQL** as the engine and **Prisma 5** as the ORM and
migration runner. A single `schema.prisma` file is the source of truth; Prisma generates
both the migration SQL and the fully-typed client.

The schema models a **learning platform** with the following core domains:

| Domain | Models |
|---|---|
| Identity & Auth | `User` |
| Catalogue | `Course`, `Module`, `Lesson` |
| Assessment | `Quiz`, `QuizQuestion`, `QuizAttempt` |
| Progress | `Enrollment`, `ModuleProgress` |

---

## 15. Prisma Folder Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma                   # Source of truth — models, enums, relations
│   └── migrations/
│       ├── migration_lock.toml         # Pins migration provider (postgresql)
│       └── <timestamp>_<name>/
│           └── migration.sql           # Auto-generated SQL (never edited by hand)
└── src/
    └── prisma/
        ├── prisma.module.ts            # Global NestJS module (exports PrismaService)
        └── prisma.service.ts           # PrismaClient lifecycle (onModuleInit / onModuleDestroy)
```

`migration_lock.toml` prevents accidentally running migrations against a different provider.
Generated migration SQL is committed to source control — migrations are never re-generated
from scratch after the first deploy.

---

## 16. Enums

```prisma
enum Role       { APPRENANT  FORMATEUR  ADMIN }
enum Level      { DEBUTANT   INTERMEDIAIRE  AVANCE }
enum LessonType { VIDEO }
```

All enums map to PostgreSQL native `ENUM` types via Prisma.

---

## 17. Entity-Relation Summary

```
User ──< Course         (User is formateur of many courses)
Course ──< Module       (Cascade delete)
Module ──< Lesson       (Cascade delete)
Module ──1 Quiz         (Cascade delete, unique per module)
Quiz ──< QuizQuestion   (Cascade delete)
Quiz ──< QuizAttempt

User ──< Enrollment     (unique [userId, courseId])
User ──< ModuleProgress (unique [userId, moduleId])
User ──< QuizAttempt
```

Cascade rules propagate deletion top-down through the course hierarchy:
`Course → Module → Lesson`, `Module → Quiz → QuizQuestion`.
`Enrollment`, `ModuleProgress`, and `QuizAttempt` are left without cascade so
historical progress data survives course mutations.

---

## 18. Full Schema — Annotated

### User

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  firstName    String?
  lastName     String?
  avatar       String?
  role         Role     @default(APPRENANT)
  refreshHash  String?          // null → logged out; non-null → active session
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  coursesCreated Course[]         @relation("FormateurCourses")
  enrollments    Enrollment[]
  moduleProgress ModuleProgress[]
  quizAttempts   QuizAttempt[]

  @@map("users")
}
```

### Course

```prisma
model Course {
  id          String   @id @default(uuid())
  title       String
  description String
  thumbnail   String?
  price       Float    @default(0)    // 0 = free
  level       Level    @default(DEBUTANT)
  category    String?
  published   Boolean  @default(false) // hidden from learners until true
  formateurId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  formateur   User         @relation("FormateurCourses", fields: [formateurId], references: [id])
  modules     Module[]
  enrollments Enrollment[]

  @@map("courses")
}
```

### Module

```prisma
model Module {
  id        String   @id @default(uuid())
  title     String
  order     Int                        // 1-based display order within course
  courseId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course   Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons  Lesson[]
  quiz     Quiz?
  progress ModuleProgress[]

  @@map("modules")
}
```

### Lesson

```prisma
model Lesson {
  id        String     @id @default(uuid())
  title     String
  type      LessonType @default(VIDEO)
  url       String?
  order     Int                        // 1-based display order within module
  moduleId  String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  module Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@map("lessons")
}
```

### Quiz & QuizQuestion

```prisma
model Quiz {
  id        String   @id @default(uuid())
  title     String
  moduleId  String   @unique          // one quiz max per module
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  module    Module         @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  attempts  QuizAttempt[]

  @@map("quizzes")
}

model QuizQuestion {
  id            String   @id @default(uuid())
  question      String
  options       String[]              // PostgreSQL text[] — array of answer strings
  correctAnswer Int                   // 0-based index into options[]
  order         Int
  quizId        String
  createdAt     DateTime @default(now())

  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@map("quiz_questions")
}
```

### Enrollment, ModuleProgress, QuizAttempt

```prisma
model Enrollment {
  id         String   @id @default(uuid())
  userId     String
  courseId   String
  enrolledAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])         // one enrollment per (user, course)
  @@map("enrollments")
}

model ModuleProgress {
  id          String   @id @default(uuid())
  userId      String
  moduleId    String
  completedAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id])
  module Module @relation(fields: [moduleId], references: [id])

  @@unique([userId, moduleId])         // idempotent — re-completing doesn't duplicate
  @@map("module_progress")
}

model QuizAttempt {
  id          String   @id @default(uuid())
  userId      String
  quizId      String
  score       Float                   // percentage 0–100
  answers     Int[]                   // chosen option index per question
  completedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  quiz Quiz @relation(fields: [quizId], references: [id])

  @@map("quiz_attempts")
}
```

---

## 19. Migration Strategy

### First migration

```bash
# From repo root — runs inside apps/api context
pnpm --filter @scriptverse/api prisma:migrate:dev
# Prisma prompts for a name; use: initial_schema
```

This generates `prisma/migrations/<timestamp>_initial_schema/migration.sql` and applies it
to the dev database. Commit the generated file immediately.

### Subsequent schema changes

1. Edit `schema.prisma`
2. `pnpm --filter @scriptverse/api prisma:migrate:dev` — Prisma diffs the schema and generates a new SQL file
3. Review the generated SQL before committing
4. Never edit migration files after they have been applied to any shared environment

### Production deploy

```bash
pnpm --filter @scriptverse/api prisma:migrate:deploy
```

`migrate deploy` applies only pending migrations — it does not generate new ones.
Run this in CI/CD before starting the API process.

### Regenerate Prisma client (after any schema change)

```bash
pnpm --filter @scriptverse/api prisma:generate
```

This is also run automatically as part of `postinstall` if wired in `package.json`.

---

## 20. Prisma Service (NestJS Integration)

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports:   [PrismaService],
})
export class PrismaModule {}
```

`@Global()` means any NestJS module that imports `PrismaModule` once (in `AppModule`)
automatically has `PrismaService` available without re-importing it.

---

## 21. Environment Variables (DB)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — `postgresql://USER:PASS@HOST:5432/scriptverse` |

The variable is read by both Prisma CLI (migrations) and the runtime client.
Never commit a real `DATABASE_URL`; use `.env` locally (git-ignored) and inject via
secrets manager in production.

---

## 22. Key Design Invariants

- **UUID primary keys** everywhere (`@default(uuid())`) — avoids sequential ID enumeration.
- **`@@map` on every model** — SQL table names are snake_case; Prisma model names stay PascalCase.
- **`published` flag on Course** — new courses are hidden from learners until explicitly published by the formateur.
- **`refreshHash` is nullable** — null means logged out; non-null means an active session exists (see §3).
- **`@@unique([userId, courseId])` on Enrollment** — prevents duplicate enrollments at the DB level, not just application level.
- **`@@unique([userId, moduleId])` on ModuleProgress** — progress tracking is idempotent; marking a module complete twice is a no-op.
- **`Quiz.moduleId @unique`** — enforces the one-quiz-per-module constraint at the DB level.
- **Cascade deletes** flow from Course → Module → Lesson / Quiz → QuizQuestion; Enrollment, ModuleProgress, and QuizAttempt are intentionally excluded to preserve historical data.
