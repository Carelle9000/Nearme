# CLAUDE-fr.md

Ce fichier fournit des consignes pour Claude Code (claude.ai/code) lors du travail avec le code dans ce dépôt.

---

## Aperçu du projet

**NearMe** est une application de rencontre hyperlocale. C'est un monorepo avec deux sous-projets indépendants :

| Sous-projet | Chemin | Stack |
|-------------|--------|-------|
| Frontend Flutter | `lib/` | Dart, Flutter, Provider, Drift |
| Backend NestJS | `server/` | TypeScript, NestJS, Prisma, PostgreSQL |

Il n'y a **pas de Firebase**. L'authentification est basée sur des JWT fournis par le backend NestJS.

---

## Commandes

### Flutter (frontend)

```bash
# Lancer sur un émulateur Android ou un appareil connecté
flutter run

# Lancer sur Chrome
flutter run -d chrome

# Construire l'APK (release)
flutter build apk --release

# Lancer les tests
flutter test

# Lancer un seul fichier de test
flutter test test/widget_test.dart

# Lint
flutter analyze

# Régénérer le code Drift ORM (obligatoire après toute modification de table dans lib/data/local/tables/)
flutter pub run build_runner build --delete-conflicting-outputs
```

### Serveur NestJS (backend)

Toutes les commandes s'exécutent depuis `server/` :

```bash
cd server

# Installer les dépendances
npm install

# Démarrer en mode dev (watch)
npm run start:dev

# Construire pour la production
npm run build

# Démarrer la build de production
npm start

# Prisma : générer le client après modification du schéma
npm run prisma:generate

# Prisma : appliquer les migrations sur la base de données
npm run prisma:migrate

# Prisma : pousser le schéma directement (dev uniquement, sans fichier de migration)
npm run db:push

# Ouvrir Prisma Studio (interface de consultation de la BDD)
npm run prisma:studio
```

### Variables d'environnement requises (`server/.env`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/nearme
JWT_SECRET=<32-char secret>
JWT_REFRESH_SECRET=<32-char secret>
FACE_PLUS_PLUS_KEY=<key>        # optionnel — repli gracieux si manquant
FACE_PLUS_PLUS_SECRET=<secret>  # optionnel
```

---

## Architecture

### Frontend Flutter

**Point d'entrée** : `lib/main.dart` initialise l'infrastructure dans l'ordre : `AppDatabase` → `SyncManager` → `AuthService` → `WsService`, puis enregistre tous les providers avant d'appeler `runApp`.

**Gestion d'état** : uniquement Provider. Chaque fonctionnalité a un `*Provider` (ChangeNotifier) qui enveloppe un service. Les services se trouvent dans `lib/data/services/`.

**Routage** : table plate de routes nommées dans `lib/app.dart`. Les routes protégées (`/discover`, `/chat`) sont enveloppées par `_AuthGuard`. La route initiale est `/discover` pour les utilisateurs déjà connectés (JWT valide) ou `/` (landing) sinon.

**Approche offline-first** : chaque entité mutable a une colonne booléenne `isSynced` dans la base locale Drift. Les écritures vont d'abord dans SQLite (`isSynced = false`), puis `SyncManager.sync()` pousse les lignes non synchronisées vers le serveur et récupère les changements depuis `last_sync`. La résolution de conflit est "Last Write Wins" basée sur `updated_at`.

**Base locale** : Drift ORM (`lib/data/local/`). Les définitions des tables sont dans `lib/data/local/tables/`. Le fichier généré est `app_database.g.dart` — **régénérez-le avec `build_runner` après toute modification de table**.

**i18n** : map statique dans `lib/l10n/app_strings.dart`. Seuls l'anglais (`en`), le français (`fr`) et l'espagnol (`es`) sont complets. Les 9 autres langues déclarées retombent sur l'anglais. Accéder aux chaînes via `context.watch<LocaleProvider>().t('key')`.

**URL du serveur** : `lib/core/config/app_config.dart` bascule entre `http://10.0.2.2:8080` (émulateur Android) et `http://localhost:8080` (web). Modifiez ceci pour des appareils physiques ou la production.

**Vérification faciale** : `FaceCompareService` est une interface abstraite. L'implémentation concrète `FacePlusPlusService` envoie selfie + photo de référence à `/faces/compare` sur le proxy backend. Si l'API est indisponible ou en timeout, `matched = true` est forcé (ne bloque jamais l'utilisateur). `isFaceVerified` n'est définie à `true` que lorsqu'une comparaison réussit réellement — **sauter le scan facial laisse le drapeau à `false`**.

**Stripe** : `StripeService` est un **stub** (`lib/data/services/stripe_service.dart`). Il simule une approbation après un court délai. Remplacez par de véritables appels au SDK Stripe Identity avant la production.

### Backend NestJS

**Modules** : `Auth`, `Sync`, `Photos`, `Faces`, `Chat` — chacun autonome dans `server/src/<module>/`.

**Flux d'auth** : `POST /auth/register` et `POST /auth/login` renvoient `access_token` (JWT court terme) + `refresh_token`. `POST /auth/refresh` effectue une rotation des deux tokens. Le `JwtGuard` extrait `userId` depuis le token et l'attache à `req.userId`.

**API Sync** : `POST /sync/push` reçoit des payloads en masse de profiles/likes/matches/messages/shared_spots. `GET /sync/pull?last_sync=<ISO>` renvoie tout ce qui a été mis à jour depuis ce timestamp. Les deux endpoints requièrent un JWT.

**Endpoint Faces** : `POST /faces/compare` est **non authentifié** (appelé pendant l'inscription avant que le compte n'existe). Il fait office de proxy vers l'API Face++. Si `FACE_PLUS_PLUS_KEY` est absent, il renvoie `{ confidence: 100 }` en repli gracieux.

**WebSocket** : `ChatGateway` écoute sur `/ws`. L'authentification se fait via le paramètre de query `?token=<jwt>` sur l'URL WebSocket. Les clients s'enregistrent par `userId` ; les messages sont routés en peer-to-peer via la map en mémoire `clients`.

**Schéma de la base** : Défini dans `server/prisma/schema.prisma`. Modèles clés : `User`, `Profile` (1-to-1 avec User), `Like`, `Match`, `Message`, `SharedSpot`, `Block`, `Subscription`.

