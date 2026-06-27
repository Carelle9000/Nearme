# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NearMe** is a hyperlocal dating app built with Flutter for the client and Firebase/Node.js for the backend. The app features real-time messaging, profile discovery with geolocation, age verification via Stripe Identity, and face comparison for authentication.

- **Client**: Flutter (iOS/Android)
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Cloud Functions**: Node.js/TypeScript (Europe-west1 region)
- **Firebase Project ID**: `nearme-bd95a`

## Architecture

The app follows a **feature-based layered architecture** with separation between UI, state management, services, and data:

```
lib/
  ├── main.dart                 # App entry point, Provider setup
  ├── app.dart                  # Root MaterialApp, routing, auth guard
  ├── core/                     # Shared utilities & infrastructure
  │   ├── router/               # Route definitions (AppRoutes)
  │   ├── theme/                # Material theme, colors
  │   ├── config/               # App-wide configuration
  │   ├── network/              # WebSocket service for real-time updates
  │   ├── sync/                 # SyncManager for offline-first sync
  │   ├── constants/            # Sample data, country configs
  │   ├── utils/                # Toasts, helpers
  │   └── widgets/              # Reusable widgets (PhotoViewer, ProfilePhotoTile, etc.)
  ├── data/                     # Models & services
  │   ├── models/               # AppUser, Profile, Conversation, etc.
  │   └── services/             # Backend integration
  │       ├── auth_service.dart          # Firebase Auth + profile sync
  │       ├── user_service.dart          # Firestore user/profile queries
  │       ├── chat_service.dart          # Message CRUD
  │       ├── match_service.dart         # Discovery & matching logic
  │       ├── photo_service.dart         # Photo upload to Cloud Storage
  │       ├── stripe_*_service.dart      # Identity & payment
  │       ├── face_compare_service.dart  # Face++ API proxy
  │       ├── notification_service.dart  # FCM token management
  │       └── location_service.dart      # Geolocation & geo-queries
  └── features/                 # Feature modules (each with screens & providers)
      ├── auth/                 # Sign-in, onboarding, identity verification
      ├── discover/             # Profile browsing with filters & swiping
      ├── chat/                 # Conversations & messaging
      ├── matches/              # Match history & profile cards
      ├── favorites/            # Saved profiles
      ├── notifications/        # Notification management
      ├── shell/                # Bottom nav & main app shell
      └── profile/              # User profile editing

functions/                       # Firebase Cloud Functions (Node.js/TS)
  ├── src/index.ts              # All cloud functions
  └── package.json              # Dependencies, build scripts
```

### State Management

The app uses **Provider** for state management:
- Each feature has a provider (e.g., `AuthProvider`, `DiscoverProvider`, `ChatProvider`)
- Providers are ChangeNotifier instances injected via MultiProvider in main.dart
- Services are injected as value providers (read-only singletons)

### Authentication & Authorization

1. **Firebase Auth**: Handles sign-in (Google, Apple, email)
2. **AuthService**: Loads cached user profile from Firestore on app start
3. **AuthGuard**: Wrapper widget that enforces login & age verification for protected routes
4. **Firestore Rules**: Enforce document-level access control (users can only read/write their own data)

### Key Features

- **Real-time Chat**: Messages via Firestore with FCM push notifications
- **Discovery**: Browse nearby profiles filtered by age, interests, distance
- **Face Verification**: Face++ API for account security (called via Cloud Function)
- **Age Verification**: Stripe Identity verification sessions with webhook handling
- **Photo Upload**: Automatic upload to Firebase Storage with signed URLs
- **Location Sync**: Uses `geoflutterfire_plus` for geo-queries

## Common Development Commands

### Flutter Client

```bash
# Get dependencies
flutter pub get

# Run on device (auto-detects platform)
flutter run

# Run on specific device (iOS)
flutter run -d macos        # or iOS device

# Run with debugging
flutter run --debug

# Lint & analyze
flutter analyze

# Format code
flutter format lib/

# Build for iOS
flutter build ios

# Build for Android
flutter build apk
```

### Cloud Functions (TypeScript)

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Watch mode (recompile on changes)
npm run build:watch

# Run emulator locally
npm run serve

# Deploy to Firebase
npm run deploy

# View logs
npm run logs

# Lint
npm run lint
```

### Firebase

```bash
# Emulate locally (Firestore, Functions, Auth)
firebase emulators:start

# Deploy all (Firestore rules, functions)
firebase deploy

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage

# Deploy only functions
firebase deploy --only functions
```

## Key Files & Locations

| Purpose | Location |
|---------|----------|
| App configuration & theme | `lib/core/theme/app_theme.dart`, `lib/core/theme/app_colors.dart` |
| Routes & navigation | `lib/core/router/app_routes.dart`, `lib/app.dart` |
| Authentication logic | `lib/data/services/auth_service.dart`, `lib/features/auth/auth_provider.dart` |
| Chat implementation | `lib/features/chat/`, `lib/data/services/chat_service.dart` |
| Firestore security rules | `firestore.rules` |
| Storage security rules | `storage.rules` |
| Cloud Functions | `functions/src/index.ts` |
| Notifications config | `firebase.json` |

## Important Patterns & Conventions

### Adding a New Feature

1. Create feature folder in `lib/features/[feature_name]/`
2. Create `[feature_name]_provider.dart` (ChangeNotifier)
3. Create screens in the same folder
4. Register provider in `main.dart` MultiProvider
5. Add routes to `AppRoutes` class

### Working with Firestore

- Collection names match domain models: `users`, `profiles`, `conversations`, `messages`, etc.
- Document IDs = Firebase Auth UID for users/profiles
- Denormalize conversation participant data for performance
- Use `cloud_firestore` package; queries use `.where()`, `.orderBy()`, `.limit()`
- Remember: Firestore has **no aggregation** — pre-compute counts and store in documents

### Photo Handling

1. Pick/capture image with `image_picker` or `camera`
2. Convert to base64 string
3. Call Cloud Function `uploadPhoto` with data + file extension
4. Function returns signed URL; store in profile/message documents

### Face Comparison

1. Get two profile photos as base64 strings
2. Call Cloud Function `compareFaces` with `image1` and `image2`
3. Returns confidence score (0–100)
4. For security checks, use threshold of ~80 confidence

### Real-time Features

- **Messaging**: Listen to `conversations/{id}/messages` subcollection with `.orderBy('timestamp').limit(50).snapshots()`
- **Online status**: Update `profiles/{uid}.lastSeen` timestamp; use `index: false` to avoid Firestore indexing overhead
- **Presence**: Use `presence_service.dart` to track online users via Firestore + WebSocket fallback

## Security Considerations

- **Never commit `.env` files** — environment variables (Stripe keys, Face++ secrets) are loaded via Firebase Functions config
- **Firestore rules** enforce user isolation: users cannot query other users' private data directly
- **Cloud Functions** validate `request.auth?.uid` before processing user-specific operations
- **Photos** are stored in `photos/{userId}/` with public read access but require auth for write
- **Age verification** is enforced at the application level via `AuthGuard` + Firestore rules

## Testing Notes

- Unit/widget tests use `flutter_test`
- Cloud Functions can be tested locally via `npm run shell` (interactive) or emulator
- Use `firebase emulators:start` for full local development (auth + Firestore + functions)

## Deployment

1. **Client**: Built via Codemagic CI/CD (see `codemagic.yaml`)
2. **Functions**: Deployed via `firebase deploy --only functions` (auto-builds TypeScript)
3. **Rules**: Use `firebase deploy --only firestore:rules,storage` for security rules
4. All deployments go to project `nearme-bd95a`
