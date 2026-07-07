# 🎯 Guide d'Exécution des Tests - NearMe

---

## 📋 Vue d'ensemble

Ce guide vous aide à exécuter les tests de manière systématique et efficace.

**Durée totale estimée:** 18 heures (sur 2-3 jours)
**Équipe recommandée:** 2 testeurs
**Plateformes:** Web (Chrome), iOS, Android

---

## 🚀 Avant de Commencer

### 1. Préparation de l'Environnement

```bash
# Cloner le repo
git clone https://github.com/your-org/nearme.git
cd nearme

# Installer les dépendances
npm install

# Copier les fichiers .env
cp .env.example .env.local

# Modifier .env.local avec:
REACT_APP_FIREBASE_CONFIG=...
STRIPE_PUBLISHABLE_KEY=...
```

### 2. Démarrer l'Application

#### Web
```bash
npm run web
# Ouvre http://localhost:3000 dans Chrome
```

#### iOS
```bash
npm start
# Dans Expo, appuyer sur 'i'
# Ouvre le simulateur iOS
```

#### Android
```bash
npm start
# Dans Expo, appuyer sur 'a'
# Ouvre l'émulateur Android
```

### 3. Préparer les Données de Test

#### Option A: Import JSON (recommandé)
```bash
# Script d'import (si disponible)
npm run setup:test-data

# Ou manuellement via Firebase Console:
# 1. Importer docs/TEST_DATA.json
# 2. Créer les utilisateurs de test
# 3. Créer les messages de test
```

#### Option B: Création Manuelle
Utiliser les données de `TEST_DATA.json` et `TEST_CASES_DETAILED.md`

### 4. Configurer les Navigateurs

**Chrome:**
```
1. Ouvrir DevTools (F12)
2. Console → vérifier qu'aucune erreur
3. Network → vérifier que les requêtes passent
4. Application → vérifier localStorage/sessionStorage
```

**Firefox:**
```
1. Ouvrir DevTools (F12)
2. Console → vérifier logs
3. Storage → vérifier données
```

**Safari:**
```
1. Développement → Afficher le menu Développement
2. Afficher la console JavaScript
3. Afficher l'inspecteur web
```

---

## 📅 Plan de Test par Jour

### **Jour 1: Tests Critiques (8-10 heures)**

#### Matin (4 heures)
```
09:00 - 09:30 : Setup et vérification de l'environnement
09:30 - 12:00 : Tests d'Authentification (TC-AUTH-001 à 005)
               ├─ Inscription avec accents ✓
               ├─ Email en double ✓
               ├─ Mot de passe faible ✓
               ├─ Récupération mot de passe ✓
               └─ Login/Logout ✓
12:00 - 13:00 : Pause déjeuner
```

#### Après-midi (4 heures)
```
13:00 - 14:30 : Tests de Profil (TC-PROFILE-001 à 003)
               ├─ Éditer bio avec accents ✓
               ├─ Gestion photos (max 6) ✓
               └─ Voir profil d'autres ✓

14:30 - 17:00 : Tests Découverte (TC-DISCOVER-001 à 002)
               ├─ Like/Pass/Super Like ✓
               ├─ Undo action ✓
               └─ Match automatique ✓

17:00 - 17:30 : Pause
```

#### Fin d'après-midi (2 heures)
```
17:30 - 19:00 : Tests Chat (TC-CHAT-001)
               ├─ Envoyer message accents ✓
               └─ Caractères spéciaux ✓
```

#### Rapport Jour 1
```
Tests réussis: __/15
Tests échoués: __/15
Bugs trouvés: __
Priorité critique: __
```

---

### **Jour 2: Tests Majeurs (8 heures)**

#### Matin (4 heures)
```
09:00 - 10:30 : Tests Caractères Spéciaux (TC-SPECIAL-001 à 003)
               ├─ Bio multilingue ✓
               ├─ Prénoms complexes ✓
               └─ Messages apostrophes ✓

10:30 - 12:00 : Tests Premium (TC-PREMIUM-001 à 003)
               ├─ Page premium ✓
               ├─ Fonctionnalités premium ✓
               └─ Page "Qui vous a aimé" ✓
12:00 - 13:00 : Pause déjeuner
```

#### Après-midi (4 heures)
```
13:00 - 14:30 : Tests Activité (TC-ACTIVITY-001 à 002)
               ├─ Voir activité ✓
               └─ Notifications ✓

14:30 - 16:00 : Tests Filtres (TC-DISCOVER-004)
               ├─ Filtres âge/distance ✓
               ├─ Filtres genre/vérification ✓
               └─ Résultats corrects ✓

16:00 - 17:00 : Tests Blocage (TC-CHAT-003)
               ├─ Bloquer utilisateur ✓
               └─ Débloquer ✓

17:00 - 17:30 : Pause
```

#### Fin d'après-midi (2 heures)
```
17:30 - 19:00 : Tests Chat Avancé (TC-CHAT-002)
               ├─ 20+ messages ✓
               └─ Performance ✓
```

#### Rapport Jour 2
```
Tests réussis: __/20
Tests échoués: __/20
Bugs trouvés: __
Priorité critique: __
```

---

### **Jour 3: Tests de Performance et Cas Limites (6-8 heures)**

#### Matin (3-4 heures)
```
09:00 - 10:00 : Tests Performance (TC-PERF-001 à 003)
               ├─ Scroll 50 profils ✓
               ├─ Chat 1000 messages ✓
               └─ Changement langue rapide ✓

10:00 - 12:00 : Tests Cas Limites (TC-BUG-001 à 003)
               ├─ Caractères corrompus ✓
               ├─ Toast vide ✓
               └─ Crash emoji ✓

12:00 - 13:00 : Pause déjeuner
```

#### Après-midi (2-3 heures)
```
13:00 - 14:00 : Plateforme Web (Chrome, Firefox, Safari)
               ├─ Responsive desktop ✓
               ├─ Responsive tablet ✓
               └─ Tous les navigateurs ✓

14:00 - 15:00 : Plateforme iOS
               ├─ Lancement ✓
               ├─ Tous les écrans ✓
               └─ Accents affichés ✓

15:00 - 16:00 : Plateforme Android
               ├─ Lancement ✓
               ├─ Tous les écrans ✓
               └─ Accents affichés ✓

16:00 - 17:00 : Rapport final et documentation
```

#### Rapport Jour 3
```
Tests réussis: __/15
Tests échoués: __/15
Bugs trouvés: __
Priorité critique: __
```

---

## 📊 Template de Rapport Quotidien

```markdown
# Rapport de Test - [Date]

## Résumé
- **Total tests exécutés:** 50
- **Tests réussis:** 47 ✅
- **Tests échoués:** 3 ❌
- **Taux de succès:** 94%

## Bugs Trouvés

### 🔴 Critique (1)
- **Bug ID:** BUG-001
  - **Titre:** Caractères spéciaux corrompus après transmission
  - **Test Case:** TC-SPECIAL-001
  - **Plateforme:** Web - Chrome
  - **Reproduction:** Éditer bio avec "François", affiche "Fran?ois"
  - **Severité:** Critique
  - **Status:** Ouvert

### 🟠 Majeur (2)
- **Bug ID:** BUG-002
  - **Titre:** Toast d'erreur vide lors de connexion échouée
  - **Plateforme:** Android
  - ...

## Tâches pour le Lendemain
- [ ] Corriger BUG-001 (encodage UTF-8)
- [ ] Corriger BUG-002 (toast d'erreur)
- [ ] Re-tester après corrections
- [ ] Continuer avec tests majeurs

## Notes
- Test de performance excellent (60 FPS maintenu)
- Tous les caractères multilingues fonctionnent
- Performance acceptable sur Android
```

---

## 🧪 Procédure de Test Détaillée

### Pour Chaque Test Case:

#### 1️⃣ Avant le Test
```
□ Vérifier l'environnement
□ Vérifier la base de données
□ Vérifier les données de test
□ Prendre screenshot de départ
□ Noter l'heure de départ
```

#### 2️⃣ Exécuter le Test
```
□ Suivre exactement les étapes
□ Documenter chaque action
□ Prendre screenshots à chaque étape
□ Documenter les résultats réels
□ Comparer avec résultats attendus
```

#### 3️⃣ Après le Test
```
□ Documenter le statut (✅ Réussi / ❌ Échoué)
□ Si échoué: créer issue GitHub
□ Nettoyer les données de test
□ Prendre screenshot final
□ Noter l'heure de fin
```

---

## 🐛 Rapport de Bug Template

Créer un issue GitHub avec ce template:

```markdown
## 🐛 Bug: [Titre court]

**Priorité:** 🔴 Critique / 🟠 Majeur / 🟡 Mineur

**Test Case:** TC-XXX-YYY

**Plateforme:** Web Chrome / iOS / Android

**Description:**
[Description du bug]

**Étapes pour Reproduire:**
1. ...
2. ...
3. ...

**Résultat Attendu:**
[Ce qui devrait se passer]

**Résultat Réel:**
[Ce qui se passe réellement]

**Données de Test:**
- Email: test.xxx@nearme.dev
- Langue: FR
- Caractères spéciaux impliqués: é, ç, etc.

**Screenshots:**
[Joindre 2-3 screenshots]

**Logs Console:**
```
[Coller les erreurs console]
```

**Affecte:**
- [ ] Fonctionnalité core
- [ ] Caractères spéciaux
- [ ] Performance
- [ ] Traduction
```

---

## ✅ Checklist de Clôture

Avant de déclarer les tests terminés:

### Tests Exécutés
- [ ] Tous les TC-AUTH (5 tests)
- [ ] Tous les TC-PROFILE (3 tests)
- [ ] Tous les TC-DISCOVER (4 tests)
- [ ] Tous les TC-CHAT (3 tests)
- [ ] Tous les TC-PREMIUM (3 tests)
- [ ] Tous les TC-ACTIVITY (2 tests)
- [ ] Tous les TC-SPECIAL (3 tests)
- [ ] Tous les TC-PERF (3 tests)
- [ ] Tous les TC-BUG (3 tests)
- [ ] Scénarios complets (4 tests)

### Plateformes
- [ ] Web - Chrome
- [ ] Web - Firefox
- [ ] Web - Safari
- [ ] iOS
- [ ] Android

### Caractères Spéciaux
- [ ] Français (é, è, ê, à, ç)
- [ ] Allemand (ä, ö, ü, ß)
- [ ] Espagnol (ñ, á, é, í, ó, ú)
- [ ] Portugais (ã, õ, ç)
- [ ] Chinois (caractères)
- [ ] Coréen (caractères)
- [ ] Japonais (hiragana, katakana, kanji)
- [ ] Emojis

### Bugs Documentés
- [ ] Tous les bugs ouverts dans GitHub
- [ ] Priorités assignées
- [ ] Équipe développement informée
- [ ] Statut accepté par équipe dev

### Documentation
- [ ] Rapport final complété
- [ ] Metrics collectées
- [ ] Observations documentées
- [ ] Recommandations fournies

---

## 🎯 Métriques à Collecter

Pour chaque test, noter:

```json
{
  "testCase": "TC-AUTH-001",
  "platform": "Web - Chrome",
  "date": "2026-07-03",
  "time": {
    "started": "09:00",
    "ended": "09:15",
    "duration_minutes": 15
  },
  "status": "passed",
  "steps_completed": 11,
  "steps_total": 11,
  "bugs_found": 0,
  "notes": "Test réussi sans problème"
}
```

---

## 🔄 Re-test Après Bug Fixes

1. **Attendre le fix** du développeur
2. **Vérifier le code** changé
3. **Re-tester** le cas spécifique (TC-XXX)
4. **Tester** les cas connexes
5. **Tester** la régression (impacts potentiels)
6. **Documenter** les résultats

---

## 📞 Escalade

### Bugs Critiques
- [ ] Alerter le PM immédiatement
- [ ] Créer issue GitHub critique
- [ ] Assigner au développeur senior
- [ ] Attendre correction dans 4 heures

### Bugs Majeurs
- [ ] Créer issue GitHub majeur
- [ ] Assigner au développeur
- [ ] Attendre correction dans 24 heures
- [ ] Re-tester le jour suivant

### Bugs Mineurs
- [ ] Créer issue GitHub mineur
- [ ] Ajouter au backlog
- [ ] Re-tester après prochaine build

---

## 📚 Ressources

- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Checklist complète
- [TEST_CASES_DETAILED.md](./TEST_CASES_DETAILED.md) - Cas de test détaillés
- [TEST_DATA.json](./TEST_DATA.json) - Données de test
- [GESTION_CARACTERES_SPECIAUX.md](./GESTION_CARACTERES_SPECIAUX.md) - Guide caractères spéciaux

---

## 🙋 Questions Fréquentes

**Q: Comment lancer les tests plus rapidement?**
A: Exécuter les tests critiques d'abord (jour 1), puis majeurs (jour 2), mineurs en dernier.

**Q: Que faire si un test échoue?**
A: Documentez le bug, créez un issue GitHub, puis continuez avec le prochain test.

**Q: Comment tester sur iOS et Android?**
A: Utiliser les émulateurs via `npm start` et sélectionner 'i' ou 'a' dans Expo CLI.

**Q: Les caractères spéciaux ne s'affichent pas?**
A: Vérifier l'encodage UTF-8 du fichier et du header Content-Type du serveur.

**Q: Besoin d'aide?**
A: Consulter les autres testeurs ou le PM.

---

## 🎓 Conseils Pratiques

1. **Tester régulièrement** - Ne pas attendre la fin pour signaler des bugs
2. **Documenter tout** - Screenshots et logs importants
3. **Être systématique** - Suivre exactement les étapes
4. **Tester les accents** - C'est une priorité pour cette app
5. **Chercher des patterns** - Un bug affecte-t-il d'autres cas?
6. **Collaborer** - Partager les trouvailles avec l'équipe
7. **Rester patient** - Les tests prennent du temps mais sauvent du code!

---

**Bonne chance avec les tests! 🚀**
