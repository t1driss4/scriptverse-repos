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
apps/api/src/auth/
├── auth.controller.ts          # HTTP endpoints (signup, login, refresh, logout, reset-password)
├── auth.module.ts              # NestJS module wiring
├── auth.service.ts             # Business logic (issueTokens, storeRefreshHash, …)
│
├── decorators/
│   ├── get-user.decorator.ts   # @GetUser() — extracts req.user or a specific field
│   └── roles.decorator.ts      # @Roles(...roles) — sets ROLES_KEY metadata
│
├── dto/
│   ├── login.dto.ts            # { email, password }
│   ├── login.dto.spec.ts
│   ├── signup.dto.ts           # { email, password, role? }
│   ├── signup.dto.spec.ts
│   ├── reset-password.dto.ts   # { email }
│   └── reset-password.dto.spec.ts
│
├── guards/
│   ├── jwt-access.guard.ts     # Extends AuthGuard('jwt')
│   ├── jwt-refresh.guard.ts    # Extends AuthGuard('jwt-refresh')
│   └── roles.guard.ts          # Checks @Roles() metadata against req.user.role
│
├── strategies/
│   ├── jwt-access.strategy.ts  # Validates Bearer token, returns JwtPayload
│   └── jwt-refresh.strategy.ts # Validates refresh token, appends raw token to payload
│
└── types/
    └── jwt-payload.type.ts     # JwtPayload, JwtRefreshPayload
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

### Guard Chain

```
Request
  └── JwtAccessGuard   (validates signature + expiry via passport-jwt)
        └── RolesGuard  (reads @Roles() metadata, checks user.role)
              └── Route handler
```

### Usage on a controller

```typescript
@Post()
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.FORMATEUR)
create(@GetUser('sub') userId: string, @Body() dto: CreateCourseDto) { … }
```

`@UseGuards` order matters: the access guard must run first so `req.user` is populated
before `RolesGuard` reads `user.role`.

### RolesGuard logic

- No `@Roles()` on the handler → public access allowed.
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

| Variable                | Default  | Purpose                         |
|-------------------------|----------|---------------------------------|
| `JWT_ACCESS_SECRET`     | —        | Signs/verifies access tokens    |
| `JWT_ACCESS_EXPIRES_IN` | `15m`    | Access token TTL                |
| `JWT_REFRESH_SECRET`    | —        | Signs/verifies refresh tokens   |
| `JWT_REFRESH_EXPIRES_IN`| `7d`     | Refresh token TTL               |
| `DATABASE_URL`          | —        | PostgreSQL connection string    |

Secrets must not have defaults in production. Both secrets are required at startup.

---

## 9. RBAC Matrix — Current Routes

| Route                      | Guard                          | Required Role       |
|----------------------------|--------------------------------|---------------------|
| `POST /auth/signup`        | none                           | public              |
| `POST /auth/login`         | none                           | public              |
| `POST /auth/refresh`       | `JwtRefreshGuard`              | authenticated       |
| `POST /auth/logout`        | `JwtAccessGuard`               | authenticated       |
| `POST /auth/reset-password`| none                           | public              |
| `GET  /courses`            | none                           | public              |
| `GET  /courses/:id`        | none                           | public              |
| `POST /courses`            | `JwtAccessGuard` + `RolesGuard`| `FORMATEUR`         |
| `GET  /courses/mine`       | `JwtAccessGuard` + `RolesGuard`| `FORMATEUR`         |
| `PATCH /courses/:id`       | `JwtAccessGuard` + `RolesGuard`| `FORMATEUR` (owner) |
| `DELETE /courses/:id`      | `JwtAccessGuard` + `RolesGuard`| `FORMATEUR` (owner) |

---

## 10. Security Notes

- **Refresh token rotation**: every `/auth/refresh` call issues a new pair and overwrites `refreshHash`. Reuse of an old refresh token fails (bcrypt mismatch).
- **Logout is revocation**: setting `refreshHash = null` invalidates any outstanding refresh token immediately.
- **No access token revocation**: access tokens are stateless and valid until expiry (15 min). Shorten TTL if stricter revocation is needed.
- **Bcrypt cost**: `SALT_ROUNDS = 10` for both password and refresh-token hashes.
- **Separate secrets**: access and refresh tokens use distinct secrets; a leaked refresh secret cannot be used to forge access tokens and vice-versa.
