# NearMe React Native Migration Plan

## Overview

Migration from Flutter to React Native (Expo) for the NearMe dating app. The app will use the same Firebase backend (Firestore, Auth, Storage, Cloud Functions) but with a new React Native/Expo frontend.

## Project Structure

```
nearme/
├── lib/                          # Original Flutter code (for reference)
├── rn-app/                       # NEW: React Native/Expo app
│   ├── src/
│   │   ├── app/                 # Expo Router screens & navigation
│   │   ├── config/              # Firebase configuration
│   │   ├── context/             # React Context (Auth, etc.)
│   │   ├── services/            # Firebase & API integrations
│   │   ├── models/              # TypeScript types & interfaces
│   │   └── components/          # Reusable React components
│   ├── .env.local               # Firebase credentials (git ignored)
│   ├── .env.example             # Template for .env.local
│   ├── package.json             # Node.js dependencies
│   └── tsconfig.json            # TypeScript config
├── functions/                    # Existing Firebase Cloud Functions (unchanged)
├── firestore.rules              # Firestore security rules (unchanged)
├── storage.rules                # Cloud Storage rules (unchanged)
└── firebase.json                # Firebase config (unchanged)
```

## Current Status ✅

**Completed:**
- ✅ React Native/Expo project initialized with TypeScript
- ✅ Firebase configuration (Auth, Firestore, Storage, Functions)
- ✅ Core service layer architecture:
  - AuthService (registration, login, logout, profile loading)
  - UserService (Firestore profile queries, likes, favorites)
  - ChatService (conversations, messages, real-time listeners)
  - MatchService (match creation & retrieval)
  - PhotoService (image picking, upload to Cloud Storage)
  - LocationService (geolocation, reverse geocoding)
  - NotificationService (FCM/Expo push tokens)
  - StripeIdentityService (age verification proxy)
  - FaceCompareService (face comparison proxy)
- ✅ Auth context for global state management
- ✅ Navigation structure (Expo Router with file-based routing)
- ✅ Authentication screens (Login, Register, Age Verification)
- ✅ Tab navigation (Discover, Matches, Chat, Profile)
- ✅ TypeScript models for all domain types

**In Progress:**
- 🔄 Testing (running `npm start -- --web` to validate compilation)

## Next Steps (Priority Order)

### Phase 1: Core Functionality (Weeks 1-2)

1. **Discover Screen**
   - [ ] Implement swipe card component (using React Native Gesture Handler)
   - [ ] Fetch nearby profiles from Firestore
   - [ ] Like/Nope/Favorite actions
   - [ ] Filter panel (age, distance, interests)
   - [ ] Prevent duplicate profiles

2. **Chat Implementation**
   - [ ] List conversations screen
   - [ ] Real-time message listener
   - [ ] Message input & send
   - [ ] Message status indicators (sent, delivered, read)
   - [ ] Typing indicators

3. **Matches Screen**
   - [ ] Display user matches
   - [ ] Show match timestamp
   - [ ] Quick action to chat

### Phase 2: Features (Weeks 3-4)

4. **Profile Management**
   - [ ] View & edit user profile
   - [ ] Upload/manage profile photos
   - [ ] Location display
   - [ ] Bio & interests editing
   - [ ] Logout functionality

5. **Location Services**
   - [ ] Request location permissions
   - [ ] Watch position updates
   - [ ] Update user location in Firestore
   - [ ] Calculate distance for discovery

6. **Notifications**
   - [ ] Request notification permissions
   - [ ] Save FCM token to Firestore
   - [ ] Handle incoming notifications
   - [ ] Badge updates for new messages/likes

### Phase 3: Advanced Features (Weeks 5-6)

7. **Age Verification**
   - [ ] Stripe Identity integration
   - [ ] Verify identity flow
   - [ ] Mark user as age-verified

8. **Face Comparison** (Optional - if needed)
   - [ ] Capture selfie
   - [ ] Compare against profile photo
   - [ ] Display confidence score

9. **Photo Management**
   - [ ] Multiple photo upload
   - [ ] Photo deletion
   - [ ] Photo ordering
   - [ ] Image compression/optimization

### Phase 4: Polish & Deployment (Week 7)

10. **UI/UX Polish**
    - [ ] Design consistency with Firebase/NearMe brand
    - [ ] Loading states
    - [ ] Error handling & user feedback
    - [ ] Dark mode support
    - [ ] Accessibility review

11. **Testing**
    - [ ] Unit tests for services
    - [ ] Integration tests for key flows
    - [ ] Manual testing on iOS & Android

12. **Deployment**
    - [ ] Set up EAS Build
    - [ ] Test production builds
    - [ ] Deploy to TestFlight & Google Play
    - [ ] Gradual rollout

## Technical Decisions

### Why React Native/Expo?

1. **Team Expertise**: Team is comfortable with JavaScript ecosystem
2. **Development Speed**: Expo provides fast iteration without native build complexity
3. **Code Reuse**: Shared logic with Node.js backend
4. **Maintenance**: Single codebase for iOS/Android (vs Flutter's dual maintenance)

### Firebase Unchanged

- **Firestore**: All collection schemas remain identical
- **Cloud Functions**: Existing Node.js functions work as-is
- **Security Rules**: No changes required
- **Authentication**: Firebase Auth + custom providers (Google, Apple) handled by expo-google-signin, etc.

### Exposition Points

1. **Performance**: Expo may be slower than Flutter for heavy UI; can eject to bare React Native if needed
2. **Native Modules**: Any new native feature requires either expo-supporting package or ejection
3. **Size**: Expo apps are larger; consider AppLoading optimization

## Development Commands

Start dev server:
```bash
cd rn-app
npm start
```

Run on iOS:
```bash
npm run ios
```

Run on Android:
```bash
npm run android
```

Run on web:
```bash
npm start -- --web
```

## Git Workflow

- Main branch: `main` (production-ready)
- Migration branch: `feat/react-native-migration` (active development)
- Feature branches: `feat/discover-screen`, `feat/chat`, etc.

## Firebase Project Details

- **Project ID**: `nearme-bd95a`
- **Region**: `europe-west1` (Cloud Functions)
- **Auth Methods**: Email/Password, Google, Apple (to be implemented)
- **Database**: Firestore (multi-region)
- **Storage**: Cloud Storage (`nearme-bd95a.appspot.com`)

## Environment Variables

Create `.env.local` in `rn-app/` with:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=nearme-bd95a
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Rollback Plan

If React Native approach doesn't work:
1. Keep Flutter version in `lib/` (unmodified)
2. Can revert to Flutter with no lost work
3. Current commit preserves both versions in git history

## Questions & Notes

- Face comparison feature may be optional depending on user feedback
- Age verification UI needs finalization (currently placeholder)
- Consider implementing push notification in Phase 2 vs Phase 3
- May need location background sync for "online presence" feature

---

**Status**: Initial scaffold complete. Ready for feature implementation.
**Last Updated**: 2026-06-29
