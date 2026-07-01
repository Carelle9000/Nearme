# 🏗️ Architecture du Projet NearMe

## 📋 Vue d'ensemble

**NearMe** est une application de rencontre React Native multiplateforme (iOS/Android/Web) construite avec:
- **Framework**: Expo + Expo Router (routing)
- **UI**: React Native + React (web)
- **Backend**: Firebase (Auth, Realtime Database, Storage, Cloud Functions)
- **State Management**: React Context API
- **TypeScript**: Type-safe development

---

## 📂 Structure du Projet

```
nearme/
├── src/                          # Code source principal de l'app
│   ├── app/                     # Routes Expo Router (file-based routing)
│   ├── services/                # Logique métier isolée
│   ├── context/                 # Global state (React Context)
│   ├── components/              # Composants réutilisables
│   ├── hooks/                   # Hooks React custom
│   ├── models/                  # Types TypeScript (interfaces)
│   ├── config/                  # Configuration Firebase
│   └── constants/               # Constantes (themes, locales)
│
├── functions/                    # Cloud Functions Firebase
│   └── src/
│       ├── index.ts             # Export des fonctions
│       ├── verification.ts      # Vérification d'identité (Stripe)
│       ├── validate-age.ts      # Validation de l'âge
│       ├── webhooks.ts          # Webhooks (Stripe)
│       ├── migrate-rtdb.ts      # Migration de données
│       └── firebase.ts          # Configuration Firebase Admin
│
├── scripts/                      # Scripts utilitaires
│   ├── seed-20-users-with-photos.js  # ✨ Seeder 20 profils
│   ├── seed-users.js            # Seeder utilisateurs (10)
│   ├── reset-project.js         # Reset Firebase
│   └── ...
│
├── assets/                       # Images et icons
│   └── images/
│
├── .expo/                        # Fichiers générés par Expo
├── node_modules/                # Dépendances npm
│
├── package.json                  # Dépendances et scripts
├── app.json                      # Configuration Expo
├── tsconfig.json                 # Configuration TypeScript
├── firebase.json                 # Configuration Firebase
├── firestore.rules               # Règles Firestore
├── database.rules.json           # Règles Realtime Database
├── firebaseConfig.json           # Config Firebase (secret)
└── .env.local                    # Variables d'environnement
```

---

## 🎯 Flux de l'Application

### 1️⃣ **Points d'entrée**

```
src/app/
├── _layout.tsx              # Root layout - AuthGuard wrapper
├── index.tsx               # Redirect vers landing/auth
├── landing.tsx             # Page d'accueil (avant login)
└── language-country.tsx    # Sélection langue/pays
```

**Flow**: Landing → Language/Country → Login/Signup → App Principale


### 2️⃣ **Authentification & Onboarding**

```
src/app/auth/
├── _layout.tsx                # Layout authentification
├── signup.tsx                 # Entrée signup
├── signup-step1.tsx           # Email + Password
├── signup-step2.tsx           # Acceptation des conditions
├── signup-step3.tsx           # Profil (nom, âge, genre, ville)
├── login.tsx                  # Connexion
├── age-verification.tsx       # Vérification d'âge (Stripe Identity)
├── age-verification-v2.tsx    # Version alternative
├── forgot-password.tsx        # Récupération mot de passe
└── register.tsx               # Registration alternative
```

**Dépendances:**
- `src/services/auth.service.ts` - Logique auth Firebase
- `src/services/signup.service.ts` - Validation signup
- `src/services/stripe-identity.service.ts` - Vérification d'âge
- `src/context/auth-context.tsx` - State utilisateur global
- `src/context/signup-context.tsx` - State signup temporaire


### 3️⃣ **Application Principale (Tabs)**

```
src/app/(tabs)/
├── _layout.tsx          # BottomTabNavigator (5 onglets)
├── discover.tsx         # Voir profils proximité (SWIPE)
├── activity.tsx         # Notifications/likes
├── matches.tsx          # Matches établis
├── chat.tsx             # Messagerie
└── profile.tsx          # Mon profil
```

**Dépendances globales:**
- `src/context/auth-context.tsx` - User courant
- `src/context/discover-context.tsx` - Profils à découvrir
- `src/context/discover-filters-context.tsx` - Filtres de recherche
- `src/context/chat-context.tsx` - Conversations
- `src/context/notification-context.tsx` - Notifications


### 4️⃣ **Pages Détails & Paramètres**

```
src/app/
├── (tabs)/
│   └── discover.tsx         # Affiche ProfileCard
│
├── matches/
│   └── [id].tsx             # Détail d'un match
│
├── chat/
│   ├── _layout.tsx
│   └── [id].tsx             # Conversation avec user
│
├── profile/
│   ├── _layout.tsx
│   ├── edit.tsx             # Édition profil
│   ├── photos.tsx           # Gestion photos
│   └── delete-account.tsx   # Suppression compte
│
├── legal/
│   ├── privacy-policy.tsx
│   └── terms-of-service.tsx
│
└── settings.tsx             # Paramètres globaux
```

---

## 🔌 Couche Services (Logique Métier)

Chaque service encapsule la logique avec Firebase:

### **Authentication** (`auth.service.ts`)
```typescript
export class AuthService {
  - createUser(email, password) → uid
  - loginUser(email, password)
  - logoutUser()
  - resetPassword(email)
  - setupAuthListener() → UnsubscribeFn
  - loadCurrentUser()
  - currentUser: AppUser | null
  - needsAgeVerify: boolean
}
```
**Dépendances:** Firebase Auth

---

### **Profils Utilisateur** (`user.service.ts`)
```typescript
export class UserService {
  - getProfile(uid) → Profile
  - updateProfile(uid, data)
  - getNearbyProfiles(lat, lon, radiusKm) → Profile[]
  - calculateDistance(lat1, lon1, lat2, lon2) → number
  - saveLike(userId, targetId)
  - saveNope(userId, targetId)
  - saveFavorite(userId, targetId)
  - getSentLikes(userId) → string[]
  - getFavorites(userId) → Profile[]
}
```
**Dépendances:** Realtime Database (`profiles/{uid}`)

---

### **Photos** (`photo.service.ts`)
```typescript
export class PhotoService {
  - requestPermissions() → boolean
  - pickImage() → uri | null
  - takePhoto() → uri | null
  - uploadProfilePhoto(userId, imageUri) → downloadUrl
  - uploadChatPhoto(conversationId, userId, imageUri) → downloadUrl
  - deletePhoto(photoUrl)
  - uriToBlob(uri) → Blob (privé)
}
```
**Dépendances:** Firebase Storage, Expo ImagePicker

---

### **Chat** (`chat.service.ts`)
```typescript
export class ChatService {
  - startConversation(userId, targetUserId) → conversationId
  - sendMessage(conversationId, userId, message)
  - getConversations(userId) → Conversation[]
  - getMessages(conversationId) → Message[]
  - setupMessagesListener(conversationId, callback)
}
```
**Dépendances:** Realtime Database (`conversations/`, `messages/`)

---

### **Découverte & Filtres** (`discover-filter.service.ts`)
```typescript
export class DiscoverFilterService {
  - getFilteredProfiles(profiles, filters) → Profile[]
  - buildFilterQuery(filters)
  - validateFilters(filters)
}
```
**Dépendances:** Aucune (logique pure)

---

### **Localisation** (`location.service.ts`)
```typescript
export class LocationService {
  - requestLocationPermission() → boolean
  - getCurrentLocation() → { latitude, longitude }
  - startLocationTracking()
  - stopLocationTracking()
}
```
**Dépendances:** Expo Location

---

### **Notification** (`notification.service.ts`)
```typescript
export class NotificationService {
  - requestPermissions() → boolean
  - setupPushNotifications(userId)
  - handleNotificationReceived(notification)
  - handleNotificationResponse(response)
}
```
**Dépendances:** Expo Notifications

---

### **Autres Services**
- `verification.ts` - Vérification identité (Stripe Identity)
- `match.service.ts` - Logique des matches
- `localization.service.ts` - i18n (français/anglais)
- `face-compare.service.ts` - Comparaison de photos (IA)
- `realtime-db.service.ts` - Helpers RTDB bas-niveau

---

## 🎨 Couche Composants

### **Pages Principale**

**`src/app/(tabs)/discover.tsx`** - La star ⭐
```typescript
Imports:
- ProfileCard            // Affiche une carte profil
- DiscoverContext        // Profils à découvrir
- DiscoverFiltersContext // Filtres applicables
- UserService            // Like/Nope/Favorite
- LocationService        // Position utilisateur

Logique:
1. Charge les profils proches via UserService
2. Filtre selon DiscoverFiltersContext
3. Affiche ProfileCard avec handlers de swipe
4. Enregistre like/nope/favorite en RTDB
```

---

### **Composants Réutilisables**

```
src/components/
├── ProfileCard.tsx          # Affiche 1 profil + actions (SWIPE)
├── ConfirmationModal.tsx    # Modal confirmation (suppressions)
├── AuthGuard.tsx            # Wrapper protection routes
├── ErrorMessage.tsx         # Affichage erreurs
├── EmptyState.tsx           # État vide
├── FilterPanel.tsx          # Filtres recherche
├── LoadingScreen.tsx        # Écran chargement
├── AnimatedIcon.tsx         # Icons animées
├── ThemedText.tsx           # Texte avec thème
├── ThemedView.tsx           # Container avec thème
├── AppTabs.tsx              # Navigation tabs (mobile)
├── ExternalLink.tsx         # Lien externe
├── HintRow.tsx              # Aide contextuelle
└── IdentityVerification.tsx # Vérification Stripe
```

**Relation:**
- Tous importent `useTheme()` pour styling
- Composants "Themed*" appliquent couleurs du contexte
- FilterPanel + ProfileCard forment la page Discover

---

## 🔄 Couche État Global (Context)

React Context remplace Redux/Zustand:

### **1. AuthContext** (`auth-context.tsx`)
```typescript
Fournit:
- user: AppUser | null        // User courant
- isLoading: boolean
- isLoggedIn: boolean
- needsAgeVerification: boolean

Méthodes:
- login(email, password)
- register(email, password, name)
- logout()
- updateProfile(updates)
- sendPasswordReset(email)
```
**Consommé par:** Toutes les pages authentifiées, AuthGuard

---

### **2. DiscoverContext** (`discover-context.tsx`)
```typescript
Fournit:
- profiles: Profile[]         // Profils à découvrir
- currentProfile: Profile | null
- isLoadingProfiles: boolean

Méthodes:
- loadProfiles(filters)
- nextProfile()
- previousProfile()
- resetProfiles()
```
**Consommé par:** `discover.tsx`, ProfileCard

---

### **3. DiscoverFiltersContext** (`discover-filters-context.tsx`)
```typescript
Fournit:
- filters: {
    ageRange: [min, max]
    distance: number
    gender: string[]
    interests: string[]
  }

Méthodes:
- setFilters(newFilters)
- resetFilters()
```
**Consommé par:** `discover.tsx`, FilterPanel

---

### **4. ChatContext** (`chat-context.tsx`)
```typescript
Fournit:
- conversations: Conversation[]
- currentConversation: Conversation | null
- messages: Message[]

Méthodes:
- loadConversations(userId)
- selectConversation(id)
- sendMessage(content)
- setupListener()
```
**Consommé par:** `chat.tsx`, `chat/[id].tsx`

---

### **5. ProfileContext** (`profile-context.tsx`)
```typescript
Fournit:
- myProfile: Profile
- isEditing: boolean
- editedProfile: Partial<Profile>

Méthodes:
- loadProfile(uid)
- startEditing()
- updateEditedProfile(updates)
- saveProfile()
- cancelEditing()
```
**Consommé par:** `profile.tsx`, `profile/edit.tsx`

---

### **6. SignupContext** (`signup-context.tsx`)
```typescript
Fournit:
- step: 1 | 2 | 3            // Étape signup
- email: string
- password: string
- profileData: Partial<Profile>
- errors: Record<string, string>

Méthodes:
- setStep(step)
- setEmail(email)
- setPassword(password)
- updateProfileData(data)
- submitStep()
- resetSignup()
```
**Consommé par:** Pages auth (`signup-step*.tsx`)

---

### **7. NotificationContext** (`notification-context.tsx`)
```typescript
Fournit:
- notifications: Notification[]
- unreadCount: number

Méthodes:
- loadNotifications(userId)
- markAsRead(notificationId)
- deleteNotification(notificationId)
- setupListener()
```
**Consommé par:** `activity.tsx`

---

### **8. LocalizationContext** (`localization-context.tsx`)
```typescript
Fournit:
- language: 'fr' | 'en'
- country: string
- t(key) → string (traduction)

Méthodes:
- setLanguage(lang)
- setCountry(country)
```
**Consommé par:** Toute l'app pour i18n

---

## 🪝 Hooks Personnalisés

```
src/hooks/
├── use-theme.ts              # Récupère theme du context
├── use-color-scheme.ts       # Mode clair/sombre
├── useProtectedRoute.ts      # Protège routes auth requises
├── useFirestoreError.ts      # Gestion erreurs Firestore
```

**Exemple:**
```typescript
// use-theme.ts
export function useTheme() {
  const { theme } = useColorScheme();
  return {
    colors: theme?.colors,
    dark: theme?.dark,
  };
}
```

---

## ⚙️ Cloud Functions Firebase

### **Déploiement**
```bash
firebase deploy --only functions
```

### **Fonctions Implémentées**

#### **1. `verification.ts`**
```typescript
export const createVerificationSession(uid, email)
  → Stripe Identity Session
  
export const verifyIdentityWebhook(body)
  → Met à jour verified: true en RTDB
```
**Déclencheurs:**
- Client: Après signup step 3
- Webhook: Stripe Identity completion

**Dépendances:**
- Stripe API
- Firebase Admin Auth
- Firebase Admin RTDB

---

#### **2. `validate-age.ts`**
```typescript
export const validateAge(uid, birthDate)
  → Vérifie age >= 18
  → Met à jour isAgeVerified
```

---

#### **3. `webhooks.ts`**
```typescript
export const stripeWebhook(request)
  → Traite webhooks Stripe
  → Met à jour statut utilisateur
```

---

#### **4. `migrate-rtdb.ts`**
```typescript
export const migrateFirestoreToRTDB()
  → Migration données Firestore → RTDB
```

---

## 📊 Modèles de Données

### **TypeScript Interfaces** (`src/models/user.ts`)

```typescript
// Utilisateur authentifié
export interface AppUser {
  id: string
  name: string
  email: string
  displayName?: string
  photoUrl?: string
  photos?: string[]           // Plusieurs photos
  birthDate?: Date
  gender?: 'male' | 'female' | 'other'
  bio?: string
  interests?: string[]
  location?: {
    latitude: number
    longitude: number
    city?: string
  }
  createdAt: Date
  updatedAt?: Date
  verified: boolean            // Stripe Identity
  isAgeVerified?: boolean      // Age >= 18
  stripeIdentitySessionId?: string
  lastSeen?: Date
}

// Profil en base de données
export interface Profile {
  uid: string
  name: string
  email: string
  displayName?: string
  photoUrl?: string
  photos?: string[]
  birthDate?: string         // ISO string (!)
  gender?: 'male' | 'female' | 'other'
  bio?: string
  interests?: string[]
  location?: {
    latitude: number
    longitude: number
    city?: string
  }
  verified: boolean
  isAgeVerified?: boolean
  createdAt: string          // ISO string (!)
  updatedAt?: string
  lastSeen?: string
}

export interface Conversation {
  id: string
  participants: string[]     // UIDs
  participantNames?: Record<string, string>
  participantPhotos?: Record<string, string>
  lastMessage?: string
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'system'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
  createdAt: Date
  deliveredAt?: Date
  readAt?: Date
  errorMessage?: string
}

export interface Match {
  id: string
  users: string[]            // 2 UIDs
  matchedAt: Date
  lastInteractionAt?: Date
}

export interface Like {
  targetId: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'like' | 'match' | 'message' | 'system'
  relatedUserId?: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}
```

### **Structure RTDB (Realtime Database)**

```
nearme-rtdb/
├── profiles/
│   └── {uid}/
│       ├── uid: string
│       ├── name: string
│       ├── email: string
│       ├── photoUrl: string
│       ├── birthDate: ISO string
│       ├── gender: string
│       ├── bio: string
│       ├── interests: string[]
│       ├── location: { latitude, longitude, city }
│       ├── verified: boolean
│       ├── isAgeVerified: boolean
│       ├── createdAt: ISO string
│       ├── updatedAt: ISO string
│       ├── sent_likes/
│       │   └── {targetId}: { createdAt }
│       ├── nopes/
│       │   └── {targetId}: { createdAt }
│       └── favorites/
│           └── {targetId}: { createdAt }
│
├── conversations/
│   └── {conversationId}/
│       ├── id: string
│       ├── participants: [uid1, uid2]
│       ├── participantNames: { uid: name }
│       ├── lastMessage: string
│       ├── lastMessageAt: timestamp
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── messages/
│   └── {conversationId}/
│       └── {messageId}/
│           ├── id: string
│           ├── conversationId: string
│           ├── senderId: string
│           ├── content: string
│           ├── type: string
│           ├── status: string
│           └── createdAt: timestamp
│
├── matches/
│   └── {uid}/
│       └── {otherUid}/
│           ├── matchedAt: timestamp
│           └── lastInteractionAt: timestamp
│
└── notifications/
    └── {userId}/
        └── {notificationId}/
            ├── type: string
            ├── title: string
            ├── message: string
            ├── read: boolean
            └── createdAt: timestamp
```

### **Firebase Storage**

```
storage/
└── photos/
    └── {userId}/
        ├── profile_1719845123456.jpg
        ├── profile_1719845134567.jpg
        └── ...
```

---

## 🔐 Configuration & Secrets

### **Firebase Configuration** (`src/config/firebase.ts`)

Initialise tous les services Firebase:
```typescript
// Imports des modules modernes
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Config depuis env vars
const firebaseConfig = {
  apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: 'nearme-bd95a',
  storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: 'https://nearme-bd95a-default-rtdb.firebaseio.com',
};

// Exports
export const auth = getAuth(app);        // Firebase Auth
export const db = getFirestore(app);     // Firestore (inutilisé?)
export const rtdb = getDatabase(app);    // Realtime Database (PRINCIPAL)
export const storage = getStorage(app);  // Cloud Storage
export const functions = getFunctions(app, 'europe-west1');
```

### **Firestore Rules** (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Les règles pour Firestore (si utilisé)
  }
}
```

### **Database Rules** (`database.rules.json`)
```json
{
  "rules": {
    "profiles": {
      "$uid": {
        ".read": "auth.uid === $uid || root.child('profiles').child($uid).exists()",
        ".write": "auth.uid === $uid"
      },
      // Contrôle d'accès par utilisateur
    }
  }
}
```

---

## 📦 Dépendances Principales

```json
{
  // React & React Native
  "react": "19.2.3",
  "react-native": "0.85.3",
  "react-dom": "19.2.3",

  // Routing & Navigation
  "expo-router": "~56.2.11",

  // Firebase (SDK moderne v9+)
  "firebase": "^12.15.0",

  // UI & Icons
  "expo-linear-gradient": "^56.0.4",
  "@expo/vector-icons": "^15.1.1",

  // Media & Images
  "expo-image": "~56.0.11",
  "expo-image-picker": "^56.0.18",
  "expo-file-system": "^57.0.0",

  // Location & Notifications
  "expo-location": "^56.0.18",
  "expo-notifications": "^56.0.18",

  // State & Storage
  "@react-native-async-storage/async-storage": "^3.1.1",

  // Dev Dependencies
  "typescript": "~6.0.3",
  "firebase-admin": "^14.1.0",
  "playwright": "^1.61.1",
  "eslint": "^9.0.0"
}
```

---

## 🚀 Scripts Disponibles

```bash
npm start              # Démarre Expo (choix plateforme)
npm run android        # Lance sur Android
npm run ios            # Lance sur iOS
npm run web            # Lance sur navigateur
npm run lint           # ESLint
npm run reset-project  # Reset données Firebase
npm run seed-20-users  # Lance seeder 20 profils ✨
```

---

## 🔄 Flux de Données Clés

### **Flux Login**
```
login() →
  AuthService.loginUser(email, password) →
    firebase.auth.signInWithEmailAndPassword() →
      AuthContext.setUser(user) →
        DiscoverContext.loadProfiles() →
          UserService.getNearbyProfiles()
```

### **Flux Swipe (Like/Nope)**
```
ProfileCard.onLike() →
  UserService.saveLike(userId, targetId) →
    rtdb.set(`profiles/{userId}/sent_likes/{targetId}`) →
      Check match bidirectionnel →
        Create Match si reciprocal
```

### **Flux Message**
```
ChatService.sendMessage(conversationId, message) →
  rtdb.push(`messages/{conversationId}/{msgId}`) →
    Update `conversations/{id}/lastMessage` →
      Notification push utilisateur (si enabled)
```

### **Flux Signup**
```
signup-step1 (email/password) →
  signup-step2 (conditions) →
    signup-step3 (profil) →
      AuthService.createUser() →
        Create Auth user →
          Create Profile RTDB →
            Navigate to age-verification →
              Stripe Identity verification →
                Update verified: true
```

---

## 🎯 Points d'Intégration Externes

### **1. Firebase**
- **Auth**: Authentification, reset password
- **Realtime Database**: Profils, messages, likes, matches
- **Cloud Storage**: Photos utilisateurs
- **Cloud Functions**: Vérification, webhooks

### **2. Stripe**
- **Identity**: Vérification d'identité (âge)
- **Webhooks**: Notification completion

### **3. Expo**
- **Push Notifications**: Notifications dans l'app
- **Image Picker**: Sélection/capture photos
- **Location**: Géolocalisation
- **Router**: File-based routing

---

## 📝 Notes d'Architecture

### **Avantages**
✅ Routing basé fichiers (simple)  
✅ Context API (légère, type-safe)  
✅ Services isolés (réutilisable)  
✅ Firestore + RTDB (flexible)  
✅ Firebase Functions (backend sans serveur)  

### **Limitations**
⚠️ Context API peut souffrir de re-renders excessifs (avec beaucoup d'utilisateurs)  
⚠️ Pas de state global robuste (Redux/Zustand serait mieux pour grosse app)  
⚠️ RTDB n'a pas de requêtes complexes (préférer Firestore pour ça)  
⚠️ Aucun système de cache robuste  

### **Améliorations Futures**
- Migrer vers Zustand pour state management
- Ajouter React Query pour data fetching + cache
- Implémenter Firestore au lieu de RTDB
- Ajouter tests (Jest, React Testing Library)
- Ajouter CI/CD (GitHub Actions)

