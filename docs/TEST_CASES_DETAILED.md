# 🧪 Cas de Test Détaillés - NearMe

**Purpose:** Fournir des cas de test spécifiques avec des données et des étapes précises

---

## 📊 Données de Test Standard

### Utilisateurs de Test

#### User 1 (Admin/Testeur)
```
Email: test.admin@nearme.dev
Password: TestAdmin123!
Name: François Dupont
Bio: J'adore la technologie et les caractères spéciaux: éàèçù
Age: 28
Gender: Homme
Location: Paris, France
Interests: Tech, Voyages, Sports
Photos: 6
Verified: ✅ Oui
Premium: ✅ Oui
```

#### User 2 (Premium)
```
Email: test.premium@nearme.dev
Password: TestPremium123!
Name: Sophie Martin
Bio: Ingénieur logiciel, J'aime l'innovation
Age: 26
Gender: Femme
Location: Lyon, France
Interests: Code, Musique, Cinéma
Photos: 4
Verified: ✅ Oui
Premium: ✅ Oui
```

#### User 3 (Basic)
```
Email: test.basic@nearme.dev
Password: TestBasic123!
Name: Jean Moreau
Bio: Découvrir de nouvelles personnes
Age: 30
Gender: Homme
Location: Marseille, France
Interests: Voyages, Lecture
Photos: 2
Verified: ❌ Non
Premium: ❌ Non
```

#### User 4 (Caractères Spéciaux)
```
Email: test.special@nearme.dev
Password: TestSpécial@123!
Name: José García
Bio: Hola! Ich spreche Deutsch, 我也会中文
Age: 25
Gender: Autre
Location: Barcelona, Spain
Interests: Langues, Musique, Cuisine
Photos: 3
Verified: ✅ Oui
Premium: ❌ Non
```

#### User 5 (Non Vérifié)
```
Email: test.unverified@nearme.dev
Password: TestUnverified123!
Name: Marie Leblanc
Bio: Nouvelle sur la plateforme
Age: 22
Gender: Femme
Location: Toulouse, France
Interests: Art, Mode, Voyage
Photos: 1
Verified: ❌ Non
Premium: ❌ Non
```

---

## 🔐 Cas de Test: Authentification

### TC-AUTH-001: Inscription Complète Avec Caractères Spéciaux
```
Prérequis: Pas d'compte existant

Étapes:
1. Aller à /language-country
2. Sélectionner "Français" et "France"
3. Cliquer "Continuer"
4. Aller à /auth/register
5. Entrer email: new.user.accents@nearme.dev
6. Entrer mot de passe: NouveauMotDePasse123!
7. Confirmer mot de passe
8. Cocher "J'accepte les conditions d'utilisation"
9. Cocher "J'accepte la politique de confidentialité"
10. Cliquer "Créer un compte"
11. Entrer prénom: François-Michaël
12. Entrer année de naissance: 1998
13. Sélectionner genre: Homme
14. Entrer bio: "Adore la programmation et l'innovation!"
15. Ajouter 2+ photos
16. Cliquer "Soumettre"

Résultats attendus:
✅ Compte créé avec succès
✅ Email reçoit confirmation
✅ Utilisateur redirigé vers dashboard
✅ Prénom avec tiret et accents sauvegardé: "François-Michaël"
✅ Bio avec accents affichée: "Adore la programmation et l'innovation!"
✅ Photos sauvegardées
```

### TC-AUTH-002: Erreur Email Déjà Existant
```
Prérequis: test.admin@nearme.dev existe

Étapes:
1. Aller à /auth/register
2. Entrer email: test.admin@nearme.dev
3. Entrer mot de passe: Password123!
4. Cliquer "Créer un compte"

Résultats attendus:
✅ Toast d'erreur affiche: "Cet email est déjà utilisé"
✅ Texte en français avec accents corrects
✅ Utilisateur reste sur page d'inscription
✅ Champs non vidés
```

### TC-AUTH-003: Mot de Passe Faible
```
Prérequis: Aucun

Étapes:
1. Aller à /auth/register
2. Entrer email: weak.pass@nearme.dev
3. Entrer mot de passe: 123456
4. Cliquer "Créer un compte"

Résultats attendus:
✅ Message d'erreur: "Mot de passe faible"
✅ Message en français avec accent correct
✅ Compte non créé
✅ Champs conservent les données
```

### TC-AUTH-004: Récupération de Mot de Passe avec Accents
```
Prérequis: Compte avec accents existe

Étapes:
1. Aller à /auth/login
2. Cliquer "Mot de passe oublié?"
3. Entrer email: test.special@nearme.dev (José García)
4. Cliquer "Envoyer le lien"
5. Vérifier email pour code
6. Entrer code sur formulaire
7. Entrer nouveau mot de passe: NouveauMotDePasse@123!
8. Confirmer mot de passe
9. Cliquer "Réinitialiser"

Résultats attendus:
✅ Email envoyé avec sujet en français
✅ Code de réinitialisation reçu
✅ Réinitialisation réussie
✅ Message: "Votre mot de passe a été réinitialisé"
✅ Redirection vers /auth/login
✅ Connexion avec nouveau mot de passe fonctionne
```

### TC-AUTH-005: Connexion Puis Déconnexion
```
Prérequis: Compte test.admin@nearme.dev existe

Étapes:
1. Aller à /auth/login
2. Entrer email: test.admin@nearme.dev
3. Entrer mot de passe: TestAdmin123!
4. Cliquer "Se connecter"
5. Attendre chargement
6. Aller à /settings
7. Cliquer "Se déconnecter"
8. Confirmer déconnexion

Résultats attendus:
✅ Connexion réussie
✅ Dashboard accessible
✅ Profil charge avec prénom "François Dupont"
✅ Déconnexion réussie
✅ Redirection vers /landing
✅ LocalStorage nettoyé
✅ Nouvelle connexion possible
```

---

## 👤 Cas de Test: Profil

### TC-PROFILE-001: Éditer Bio Avec Caractères Spéciaux Multiples
```
Prérequis: Connecté en tant que test.admin@nearme.dev

Étapes:
1. Aller à /profile/edit
2. Trouver champ "Bio"
3. Effacer bio existante
4. Entrer nouvelle bio: "J'aime la programmation, les voyages et l'innovation! 🚀"
5. Ajouter: "Parlez-moi de vos intérêts."
6. Cliquer "Enregistrer"

Résultats attendus:
✅ Bio sauvegardée avec accents: é, è, ç
✅ Bio sauvegardée avec apostrophes: l', d'
✅ Bio sauvegardée avec emoji: 🚀
✅ Toast: "Profil mis à jour"
✅ Rafraîchir page et bio toujours présente
✅ Prénoms d'autres utilisateurs voient cette bio correctement
```

### TC-PROFILE-002: Gestion Photos (Max 6)
```
Prérequis: Connecté, profil accessible

Étapes:
1. Aller à /profile/photos
2. Cliquer "Ajouter une photo"
3. Sélectionner photo depuis galerie (répéter 6 fois)
4. Voir 6 photos affichées
5. Cliquer "Ajouter une photo" une 7e fois

Résultats attendus:
✅ Premières 6 photos se chargent
✅ Toast: "Limite atteinte"
✅ Message français: "Vous pouvez ajouter maximum 6 photos"
✅ 7e photo refusée
✅ Suppression d'une photo libère l'emplacement
✅ Peut alors ajouter nouvelle photo
```

### TC-PROFILE-003: Voir Profil d'Autre Utilisateur
```
Prérequis: Connecté en tant que test.admin@nearme.dev
           test.premium@nearme.dev existe

Étapes:
1. Aller à /discover
2. Trouver profil de "Sophie Martin"
3. Cliquer sur la carte de profil
4. Aller à /profile/[sophieId]

Résultats attendus:
✅ Profil charge
✅ Nom affiche: "Sophie Martin"
✅ Bio affiche: "Ingénieur logiciel, J'aime l'innovation"
✅ Photos affichent (4 photos)
✅ Âge affiche: 26
✅ Distance affiche correctement
✅ Badge "Vérifié" affiche
✅ Boutons d'action visibles (Like, Message, Block)
```

---

## 💘 Cas de Test: Découverte et Matching

### TC-DISCOVER-001: Like + Super Like + Pass
```
Prérequis: Connecté en tant que test.admin@nearme.dev
           Au moins 3 profils disponibles

Étapes:
1. Aller à /discover
2. Voir première carte
3. Cliquer "J'aime"
4. Voir deuxième carte
5. Cliquer "Super J'aime"
6. Voir troisième carte
7. Cliquer "Passer"

Résultats attendus:
✅ Like enregistré
✅ Profile disparaît de la découverte
✅ Nouvelle carte apparaît
✅ Super Like enregistré (couleur différente)
✅ Pass enregistré
✅ Undo affiche après chaque action
```

### TC-DISCOVER-002: Undo Action
```
Prérequis: Connecté, action Like/Pass effectuée

Étapes:
1. Effectuer Like sur une carte
2. Voir apparition du bouton "Undo"
3. Cliquer "Undo" immédiatement
4. Attendre quelques secondes
5. Voir si "Undo" disparaît

Résultats attendus:
✅ Like annulé
✅ Profil revient en découverte
✅ Bouton "Undo" disparaît après ~10 secondes
✅ Nouveau Like sur même personne compté comme nouveau Like
```

### TC-DISCOVER-003: Match Automatique
```
Prérequis: test.admin@nearme.dev et test.premium@nearme.dev se like mutuellement

Étapes:
1. Connecté en tant que test.admin@nearme.dev
2. Aller à /discover
3. Like "Sophie Martin" (test.premium)
4. Ouvrir incognito, connecter test.premium
5. Aller à /discover
6. Like "François Dupont" (test.admin)
7. Revenir à test.admin

Résultats attendus:
✅ Toast: "NOUVELLE CORRESPONDANCE" après double Like
✅ Message en français avec maj
✅ Match visible dans /matches
✅ Correspondance bidirectionnelle
✅ Chat créé automatiquement
```

### TC-DISCOVER-004: Filtres de Découverte
```
Prérequis: Connecté, au moins 10 profils disponibles

Étapes:
1. Aller à /discover
2. Cliquer sur icône "Filtrer"
3. Sélectionner:
   - Âge: 25-30
   - Distance: 5-20 km
   - Genre: Femme
   - Vérification: Vérifié uniquement
4. Appliquer filtres
5. Voir résultats filtrés

Résultats attendus:
✅ Filtres s'appliquent
✅ Seuls les profils correspondants affichent
✅ Résultats filtrés persistent au scroll
✅ Réinitialisation possible
✅ Textes en français: "Filtrer", "Appliquer", "Réinitialiser"
```

---

## 💬 Cas de Test: Messagerie

### TC-CHAT-001: Envoyer Message Avec Accents
```
Prérequis: Connecté en tant que test.admin@nearme.dev
           Une correspondance avec test.premium@nearme.dev existe

Étapes:
1. Aller à /chat
2. Cliquer sur conversation avec "Sophie Martin"
3. Voir /chat/[sophieId]
4. Taper dans champ: "Bonjour! Ça va? J'adore ta bio!"
5. Cliquer "Envoyer"
6. Attendre confirmations

Résultats attendus:
✅ Message affiche avec accents corrects: é, ç, à
✅ Message affiche correctement: "Ça va?"
✅ Toast confirmation: "Message envoyé"
✅ Horodatage affiche
✅ Statut de livraison affiche
✅ Message persiste après refresh
✅ Autre utilisateur reçoit le message
```

### TC-CHAT-002: Conversation Longue
```
Prérequis: Connecté, chat avec test.premium ouvert

Étapes:
1. Envoyer 20+ messages
2. Chacun avec caractères différents:
   - "Grüße aus Deutschland!" (allemand)
   - "Jusqu'à demain!" (français)
   - "¡Hola! ¿Qué tal?" (espagnol)
   - "你好! 我叫François" (mandarin)
   - "안녕하세요!" (coréen)
   - "こんにちは!" (japonais)
   - "Oi! Tudo bem?" (portugais)
3. Scroller vers haut pour voir anciens messages
4. Scroller vers bas pour voir nouveaux

Résultats attendus:
✅ Tous les messages avec accents chargent
✅ Tous les caractères unicode s'affichent
✅ Performance reste bonne avec 20+ messages
✅ Scroll fluide
✅ Pas de messages dupliqués
✅ Ordre chronologique respecté
```

### TC-CHAT-003: Bloquer Utilisateur
```
Prérequis: Connecté, conversation ouverte avec test.basic

Étapes:
1. Aller à /chat/[jeanId]
2. Cliquer menu options (3 points)
3. Cliquer "Bloquer"
4. Confirmer dans dialogue

Résultats attendus:
✅ Dialogue de confirmation affiche
✅ Message: "Êtes-vous sûr(e)?"
✅ Utilisateur bloqué disparaît de chats
✅ Utilisateur n'apparaît plus en découverte
✅ Messages précédents restent (ou supprimés selon implémentation)
✅ Déblocage possible depuis /settings
```

---

## ⭐ Cas de Test: Premium

### TC-PREMIUM-001: Vérifier Page Premium
```
Prérequis: Connecté en tant que utilisateur basic (test.basic)

Étapes:
1. Aller à /premium
2. Voir description des avantages
3. Voir prix et essai gratuit
4. Cliquer sur lien d'achat

Résultats attendus:
✅ Page charge
✅ Titre: "Accès Premium"
✅ Trois avantages listés:
   - "Accès complet aux profils"
   - "Messagerie illimitée"
   - "Localisation précise"
✅ Prix affiche: "$12.99/month USD"
✅ Texte: "7 jours essai gratuit" (en français)
✅ Lien Stripe fonctionne
✅ Redirection vers paiement
```

### TC-PREMIUM-002: Fonctionnalités Avec Premium
```
Prérequis: Connecté en tant que test.premium (premium actif)

Étapes:
1. Aller à /discover
2. Voir profil non-vérifié
3. Cliquer pour voir profil complet
4. Aller à /chat
5. Envoyer messages illimités

Résultats attendus:
✅ Profils non-vérifié vus complètement
✅ Pas de limite de messages
✅ Localisation plus précise disponible
✅ Badge "Premium" affiche sur profil propre
✅ Fonctionnalités premium verrouillées pour non-premium
```

### TC-PREMIUM-003: Page "Qui Vous A Aimé"
```
Prérequis: Connecté en tant que test.premium
           Plusieurs utilisateurs aiment son profil

Étapes:
1. Aller à /premium/liked
2. Voir liste d'utilisateurs

Résultats attendus:
✅ Page charge
✅ Liste affiche avec photos et noms
✅ Noms avec accents affichent: "José García", "Müller"
✅ Boutons Like/Match visibles
✅ Clic Like/Match met à jour base de données
✅ Non-premium voit Feature Lock
```

---

## 📢 Cas de Test: Activité et Notifications

### TC-ACTIVITY-001: Voir Activité
```
Prérequis: Connecté, plusieurs utilisateurs like/visit/match

Étapes:
1. Aller à /activity
2. Voir liste d'activités

Résultats attendus:
✅ Activités "A aimé votre profil" affichent
✅ Activités "A visité votre profil" affichent
✅ Activités "Nouvelle correspondance" affichent
✅ Noms avec accents: "François Dupont", "José García"
✅ Horodatage affiche: "Il y a 2 minutes", "Il y a 1 heure"
✅ Clic sur activité ouvre profil correspondant
```

### TC-ACTIVITY-002: Notifications Push
```
Prérequis: App autorisée pour notifications
           Autre utilisateur effectue une action

Étapes:
1. App en arrière-plan
2. Autre utilisateur aime votre profil
3. Attendre notification push

Résultats attendus:
✅ Notification reçue
✅ Titre en français
✅ Texte avec accents corrects
✅ Clic sur notification ouvre profil de l'utilisateur
✅ Pas de notification si refusées
```

---

## 🌍 Cas de Test: Caractères Spéciaux Complets

### TC-SPECIAL-001: Test Bio Complète Multilingue
```
Prérequis: Accès profil d'édition

Étapes:
1. Éditer bio
2. Entrer texte:
"""
Hello! 你好! مرحبا!
Français: J'adore l'innovation, très passionné!
German: Grüße aus München! Über vieles interessieren!
Spanish: ¡Hola! Me encanta viajar.
Japanese: こんにちは！プログラミングが好きです。
Korean: 안녕하세요! 저는 엔지니어입니다.
Portuguese: Olá! Tudo bem com você?
Emojis: 🚀 💻 🌍 👍 😊 ✨
"""
3. Sauvegarder
4. Rafraîchir page
5. Voir profil en tant qu'autre utilisateur

Résultats attendus:
✅ Tous les accents français: é, è, ê, à, ù, ç
✅ Tous les caractères allemands: ä, ö, ü, ß
✅ Tous les caractères espagnols: ñ, á, é, í, ó, ú
✅ Tous les caractères portugais: ã, õ, ç, é
✅ Tous les caractères chinois affichent
✅ Tous les caractères coréens affichent
✅ Tous les caractères japonais affichent
✅ Tous les emojis affichent
✅ Texte reste intact après transmission API
```

### TC-SPECIAL-002: Prénom Avec Caractères Complexes
```
Prérequis: Édition de profil

Étapes:
1. Éditer prénom
2. Tester chaque variante:
   - "François" (accent aigu)
   - "Müller" (umlaut allemand)
   - "José" (accent sur é)
   - "O'Connor" (apostrophe)
   - "Jean-Pierre" (tiret)
   - "François-Michaël" (tiret + deux accents)
3. Sauvegarder chacun
4. Rafraîchir et vérifier

Résultats attendus:
✅ Tous les prénoms sauvegardés correctement
✅ Accents préservés: François, Müller, José
✅ Apostrophes préservées: O'Connor
✅ Tirets préservés: Jean-Pierre
✅ Combinaisons préservées: François-Michaël
✅ Affichage correct dans tous les contextes
```

### TC-SPECIAL-003: Messages Avec Apostrophes
```
Prérequis: Chat ouvert

Étapes:
1. Envoyer messages:
   - "L'amour c'est important"
   - "D'accord avec toi"
   - "C'est l'heure d'aller"
   - "J'aime vraiment ça"
   - "Qu'est-ce qu'il y a?"
2. Rafraîchir chat
3. Vérifier affichage

Résultats attendus:
✅ Apostrophes affichent correctement: '
✅ Contraction "l'" affiche: L'amour
✅ Contraction "d'" affiche: D'accord
✅ Contraction "c'" affiche: C'est
✅ Pas de double apostrophes
✅ Pas d'apostrophes échappées inutilement
```

---

## 🚀 Cas de Test: Performance et Charge

### TC-PERF-001: Scroll Découverte 50 Profils
```
Prérequis: Connecté, 50+ profils disponibles

Étapes:
1. Aller à /discover
2. Scroller rapidement 50 profils
3. Mesurer FPS et lag
4. Envoyer 10 likes rapidement
5. Scroller 50 profils supplémentaires

Résultats attendus:
✅ FPS reste constant ~60
✅ Pas de freeze lors du scroll
✅ Scroll fluide
✅ Likes enregistrés correctement
✅ Pas de crash
✅ Pas de duplication de profils
```

### TC-PERF-002: Chat Avec 1000 Messages
```
Prérequis: Connecté, chat chargé avec 1000 messages

Étapes:
1. Aller à /chat/[userId]
2. Attendre chargement
3. Mesurer temps de chargement
4. Scroller vers haut (anciens messages)
5. Scroller vers bas (messages récents)
6. Envoyer nouveau message

Résultats attendus:
✅ Chargement < 3 secondes
✅ Scroll fluide
✅ Pas de freeze
✅ Nouveau message s'ajoute rapidement
✅ Pas de crash avec 1000+ messages
```

### TC-PERF-003: Changement de Langue Rapide
```
Prérequis: Connecté

Étapes:
1. Aller à /settings
2. Changer langue 5 fois rapidement (FR→EN→DE→FR→EN)
3. Chaque fois vérifier UI redessine
4. Envoyer message pendant changement

Résultats attendus:
✅ Langue change immédiatement
✅ Texte redessine correctement
✅ Pas de corruption d'affichage
✅ Pas de crash
✅ Message envoyé dans bonne langue
```

---

## 🐛 Cas de Test: Bugs Courants

### TC-BUG-001: Caractères Spéciaux Corrompus Après Transmission
```
Symptôme: Bio affiche "Fran?ois" au lieu de "François"

Étapes:
1. Éditer bio: "François adore l'innovation!"
2. Sauvegarder
3. Voir profil d'autre utilisateur
4. Vérifier affichage

Résultats attendus:
✅ "François" affiche correctement
✅ Pas de "?" à la place des accents
✅ Apostrophe affiche: '
✅ Si bug, vérifier:
   - Encodage du fichier (UTF-8?)
   - Header Content-Type (charset=utf-8?)
   - Database encoding (UTF-8?)
```

### TC-BUG-002: Toast D'Erreur Vide
```
Symptôme: Toast affiche vide au lieu de message d'erreur

Étapes:
1. Tenter connexion avec email invalide
2. Voir résultat

Résultats attendus:
✅ Toast affiche message d'erreur
✅ Message non vide
✅ Message en français
✅ Accents corrects
✅ Si vide, vérifier useLocalization() hook
```

### TC-BUG-003: Crash Au Envoi Message Avec Emoji
```
Symptôme: App crash quand envoyer message avec emoji

Étapes:
1. Ouvrir chat
2. Taper: "Bonjour 👋 ça va?"
3. Envoyer

Résultats attendus:
✅ Message envoie sans crash
✅ Emoji affiche correctement à la réception
✅ Si crash, vérifier:
   - Gestion des emoji en transmission
   - Encodage UTF-8 sur serveur
```

---

## 📋 Tableau de Synthèse

| Catégorie | Cas de Test | Priorité | Statut |
|-----------|------------|----------|--------|
| Auth | Login/Signup avec accents | 🔴 Critique | ⬜ |
| Auth | Récupération mot de passe | 🟠 Majeur | ⬜ |
| Profil | Éditer bio avec accents | 🔴 Critique | ⬜ |
| Profil | Photos (6 max) | 🟠 Majeur | ⬜ |
| Découverte | Like/Pass/Super Like | 🔴 Critique | ⬜ |
| Découverte | Filtres | 🟠 Majeur | ⬜ |
| Chat | Envoyer message accents | 🔴 Critique | ⬜ |
| Chat | 1000+ messages | 🟡 Mineur | ⬜ |
| Premium | Page premium | 🟠 Majeur | ⬜ |
| Spécial | Multilingue complet | 🔴 Critique | ⬜ |
| Performance | Scroll 50 profils | 🟡 Mineur | ⬜ |

---

## 🎯 Stratégie de Test Recommandée

### Phase 1: Critique (Day 1)
- TC-AUTH-001 à 005 (Authentification)
- TC-PROFILE-001 (Bio avec accents)
- TC-DISCOVER-001 (Like/Pass/Super Like)
- TC-CHAT-001 (Message avec accents)
- TC-SPECIAL-001 à 003 (Caractères spéciaux)

### Phase 2: Majeur (Day 2)
- TC-PROFILE-002 à 003 (Photos, Voir profil)
- TC-DISCOVER-002 à 004 (Undo, Match, Filtres)
- TC-CHAT-002 à 003 (Long chat, Bloquer)
- TC-PREMIUM-001 à 003 (Premium)
- TC-ACTIVITY-001 à 002 (Activité, Notifications)

### Phase 3: Mineur (Day 3)
- TC-PERF-001 à 003 (Performance)
- TC-BUG-001 à 003 (Bugs courants)
- Cas limites et edge cases

---

## 📞 Rapport de Bug Template

```markdown
## Bug Report: [Titre]

**Priorité:** 🔴 Critique / 🟠 Majeur / 🟡 Mineur

**Affecte:** Web / iOS / Android

**Test Case:** TC-XXX-YYY

**Description:**
[Décrire le bug avec détails]

**Étapes pour Reproduire:**
1. 
2. 
3. 

**Résultat Attendu:**
[Décrire ce qui devrait se passer]

**Résultat Réel:**
[Décrire ce qui se passe vraiment]

**Données de Test:**
- Email: 
- Langue: FR / EN / DE / etc.
- Plateforme: Web / iOS / Android
- Navigateur/OS: 

**Screenshot/Video:**
[Joindre si possible]

**Contexte Supplémentaire:**
[Caractères spéciaux impliqués? Encodage? etc.]
```
