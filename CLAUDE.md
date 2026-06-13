# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**NearMe** is a hyperlocal dating app. It is a monorepo with two independent sub-projects:

| Sub-project | Path | Stack |
|-------------|------|-------|
| Flutter frontend | `lib/` | Dart, Flutter, Provider, Drift |
| NestJS backend | `server/` | TypeScript, NestJS, Prisma, PostgreSQL |

There is **no Firebase**. Authentication is JWT-based via the NestJS backend.

---

## Commands

### Flutter (frontend)

```bash
# Run on Android emulator or connected device
flutter run

# Run on Chrome
flutter run -d chrome

# Build APK (release)
flutter build apk --release

# Run tests
flutter test

# Run a single test file
flutter test test/widget_test.dart

# Lint
flutter analyze

# Regenerate Drift ORM code (required after changing any table in lib/data/local/tables/)
flutter pub run build_runner build --delete-conflicting-outputs
```

### NestJS server (backend)

All commands run from `server/`:

```bash
cd server

# Install dependencies
npm install

# Start in dev mode (watch)
npm run start:dev

# Build for production
npm run build

# Start production build
npm start

# Prisma: generate client after schema change
npm run prisma:generate

# Prisma: apply migrations to the database
npm run prisma:migrate

# Prisma: push schema directly (dev only, no migration file)
npm run db:push

# Open Prisma Studio (DB browser UI)
npm run prisma:studio
```

### Required environment variables (`server/.env`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/nearme
JWT_SECRET=<32-char secret>
JWT_REFRESH_SECRET=<32-char secret>
FACE_PLUS_PLUS_KEY=<key>        # optional — graceful fallback if missing
FACE_PLUS_PLUS_SECRET=<secret>  # optional
```

---

## Architecture

### Flutter frontend

**Entry point**: `lib/main.dart` bootstraps infrastructure in order: `AppDatabase` → `SyncManager` → `AuthService` → `WsService`, then wires all providers before calling `runApp`.

**State management**: Provider only. Each feature has a `*Provider` (ChangeNotifier) that wraps a service. Services live in `lib/data/services/`.

**Routing**: Flat named-route table in `lib/app.dart`. Protected routes (`/discover`, `/chat`) are wrapped in `_AuthGuard`. Initial route is `/discover` for returning users (valid JWT) or `/` (landing) otherwise.

**Offline-first pattern**: Every mutable entity has an `isSynced` boolean column in the local Drift database. Writes go to SQLite first (`isSynced = false`), then `SyncManager.sync()` pushes unsynced rows to the server and pulls changes since `last_sync`. Conflict resolution is Last Write Wins on `updated_at`.

**Local database**: Drift ORM (`lib/data/local/`). Table definitions are in `lib/data/local/tables/`. The generated file is `app_database.g.dart` — **regenerate it with `build_runner` after any table change**.

**i18n**: Static map in `lib/l10n/app_strings.dart`. Only English (`en`), French (`fr`), and Spanish (`es`) are complete. The other 9 declared languages fall back to English. Access strings via `context.watch<LocaleProvider>().t('key')`.

**Server URL**: `lib/core/config/app_config.dart` switches between `http://10.0.2.2:8080` (Android emulator) and `http://localhost:8080` (web). Change this for physical devices or production.

**Face verification**: `FaceCompareService` is an abstract interface. The concrete implementation `FacePlusPlusService` sends selfie + reference photo to `/faces/compare` on the backend proxy. If the API is unavailable or times out, `matched = true` is forced (never blocks the user). `isFaceVerified` is only set to `true` when a comparison actually passes — **skipping the face scan leaves the flag `false`**.

**Stripe**: `StripeService` is a **stub** (`lib/data/services/stripe_service.dart`). It simulates approval after a short delay. Replace with real Stripe Identity SDK calls before production.

### NestJS backend

**Modules**: `Auth`, `Sync`, `Photos`, `Faces`, `Chat` — each self-contained in `server/src/<module>/`.

**Auth flow**: `POST /auth/register` and `POST /auth/login` return `access_token` (short-lived JWT) + `refresh_token`. `POST /auth/refresh` rotates both tokens. The `JwtGuard` extracts `userId` from the token and attaches it to `req.userId`.

**Sync API**: `POST /sync/push` receives bulk payloads of profiles/likes/matches/messages/shared_spots. `GET /sync/pull?last_sync=<ISO>` returns everything updated since that timestamp. Both endpoints require JWT.

**Faces endpoint**: `POST /faces/compare` is **unauthenticated** (called during registration before the account exists). It proxies to the Face++ API. If `FACE_PLUS_PLUS_KEY` is absent, it returns `{ confidence: 100 }` as a graceful fallback.

**WebSocket**: `ChatGateway` listens at `/ws`. Authentication is via `?token=<jwt>` query parameter on the WebSocket URL. Clients register by `userId`; messages are routed directly peer-to-peer via the in-memory `clients` map.

**Database schema**: Defined in `server/prisma/schema.prisma`. Key models: `User`, `Profile` (1-to-1 with User), `Like`, `Match`, `Message`, `SharedSpot`, `Block`, `Subscription`.
