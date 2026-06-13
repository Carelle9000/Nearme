# /ship-feature

Pipeline complet de livraison d'une feature NearMe. Orchestre plan → implémentation → revue → tests → audit → commit/PR.

**Usage :** `/ship-feature <description de la feature>`

---

## Pipeline d'exécution

### Étape 1 — Planification

Entre en Plan Mode. Analyse la feature demandée et produit :
- Liste des fichiers à créer/modifier (frontend `lib/` et/ou backend `server/src/`)
- Impact sur le schéma Prisma (nouvelle migration ?)
- Impact sur les tables Drift (relancer `build_runner` ?)
- Dépendances entre les changements

Attends validation du plan avant de continuer.

### Étape 2 — Implémentation

Implémente la feature en respectant l'architecture NearMe :

- **Flutter** : Provider + service + table Drift si nécessaire. `isSynced = false` sur les writes locaux. Strings via `context.watch<LocaleProvider>().t('key')`.
- **NestJS** : Module auto-contenu dans `server/src/<module>/`. `JwtGuard` sur tous les endpoints sensibles. DTO avec class-validator.
- **Sync** : si une nouvelle entité est créée, l'ajouter au `POST /sync/push` et `GET /sync/pull`.

### Étape 3 — Revue de code

Lance le subagent `code-reviewer` sur les fichiers modifiés.

```
Passe en revue les fichiers suivants récemment modifiés pour la feature "$ARGUMENTS" :
[liste des fichiers implémentés à l'étape 2]
```

Si des problèmes **critiques** (🔴) sont détectés, les corriger avant de continuer.

### Étape 4 — Génération des tests

Lance le subagent `test-writer` sur les nouveaux services/modules.

```
Génère les tests pour les fichiers suivants :
[liste des fichiers de services/modules créés]
```

### Étape 5 — Audit de sécurité

Lance le subagent `security-auditor` si la feature touche l'un de ces domaines :
- Authentification / JWT
- Sync API (push/pull)
- Photos / Face verification
- WebSocket
- Paiement (même stub)

```
Audite la sécurité des fichiers suivants liés à "$ARGUMENTS" :
[liste des fichiers concernés]
```

Si des problèmes **critiques** (🚨) sont détectés, les corriger avant le commit.

### Étape 6 — Commit & PR

1. Si le schéma Prisma a changé : `cd server && npm run prisma:migrate`
2. Si une table Drift a changé : `flutter pub run build_runner build --delete-conflicting-outputs`
3. Staging des fichiers modifiés (pas de `git add -A`)
4. Commit avec message conventionnel : `feat(<scope>): <description>`
5. Créer la PR avec résumé des changements et plan de test

---

## Résumé final

À la fin du pipeline, afficher :

```
✅ Feature livrée : <nom>
📁 Fichiers modifiés : N
🧪 Tests créés : N
🔍 Revue : <nb problèmes critiques> critiques, <nb warnings> warnings
🔒 Audit sécu : <exécuté / ignoré (hors périmètre)>
🔗 PR : <url>
```
