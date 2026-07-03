# 📋 Checklist Complète de Test - NearMe

**Date de création:** 2026-07-03  
**Version:** 1.0  
**Statut:** En cours

---

## 🎯 Vue d'Ensemble

Cette checklist couvre tous les aspects de l'application NearMe, y compris:
- Authentification et gestion de compte
- Profil utilisateur
- Découverte et correspondances
- Messagerie
- Fonctionnalités premium
- Vérification et sécurité
- Caractères spéciaux (FR, DE, ES, PT, etc.)

---

## 🔐 Section 1: Authentification et Inscription

### 1.1 Page d'Accueil (Landing)
- [ ] Page se charge correctement
- [ ] Bouton "Se connecter" redirige vers /auth/login
- [ ] Bouton "Créer mon profil" redirige vers /auth/register
- [ ] Bouton "Comment ça marche" affiche les informations
- [ ] Logo s'affiche correctement
- [ ] Textes avec accents (Bienvenue, Vérifié, etc.) s'affichent correctement

### 1.2 Sélection Langue/Pays
- [ ] Page de sélection langue s'affiche
- [ ] Les 7 langues sont listées (FR, EN, DE, ZH, KO, JA, PT)
- [ ] Les 28 pays sont listés
- [ ] Recherche de pays fonctionne
- [ ] Sélection sauvegardée en localStorage
- [ ] Les caractères spéciaux des noms de pays s'affichent (Suisse, Espagne, Pérou)

### 1.3 Connexion (Login)
- [ ] Page se charge
- [ ] Email invalide affiche erreur: "Veuillez entrer une adresse email valide"
- [ ] Mot de passe vide affiche erreur: "Le mot de passe est requis"
- [ ] Identifiants valides permettent la connexion
- [ ] Identifiants invalides affichent erreur appropriée
- [ ] "Mot de passe oublié" redirige vers la page de récupération
- [ ] "S'inscrire" redirige vers l'inscription
- [ ] Bouton "Afficher/Masquer mot de passe" fonctionne
- [ ] Toast d'erreur en français s'affiche correctement
- [ ] Caractères spéciaux dans email (jean@éxample.com) sont gérés

### 1.4 Récupération de Mot de Passe
- [ ] Page se charge
- [ ] Email invalide affiche erreur
- [ ] Email valide envoie le lien de récupération
- [ ] Le code reçu par email fonctionne
- [ ] Nouveau mot de passe est validé (min 8 caractères)
- [ ] Nouveau mot de passe doit correspondre
- [ ] Confirmation réussie redirige vers login
- [ ] Messages d'erreur en français corrects
- [ ] Accents dans messages de confirmation s'affichent

### 1.5 Inscription - Étape 1 (Compte)
- [ ] Formulaire se charge
- [ ] Email valide est accepté
- [ ] Email existant affiche: "Cet email est déjà utilisé"
- [ ] Mot de passe faible affiche: "Mot de passe faible"
- [ ] Les mots de passe doivent correspondre
- [ ] Confirmation de la politique de confidentialité requise
- [ ] Bouton "Suivant" active après validation
- [ ] Caractères spéciaux dans mot de passe fonctionnent (élève123!)

### 1.6 Inscription - Étape 2 (Vérification d'Identité)
- [ ] Page se charge
- [ ] Téléchargement de document fonctionne
- [ ] Types de documents acceptés: Passeport, Carte d'identité, Permis
- [ ] Vérification en cours affiche correctement
- [ ] Vérification réussie affiche: "Vérification réussie!"
- [ ] Vérification échouée affiche message d'erreur français
- [ ] Option "Vérifier plus tard" fonctionne
- [ ] Accents dans messages de vérification corrects

### 1.7 Inscription - Étape 3 (Profil)
- [ ] Formulaire se charge
- [ ] Prénom/Nom acceptent caractères spéciaux (François, José, Müller)
- [ ] Année de naissance validée (minimum 18 ans)
- [ ] Genre (Homme, Femme, Non-binaire, Non spécifié)
- [ ] Bio accepte caractères spéciaux et accents
- [ ] Photos: Maximum 6 photos
- [ ] Ajout de photo depuis galerie fonctionne
- [ ] Suppression de photo fonctionne
- [ ] Intérêts peuvent être sélectionnés
- [ ] Validation des champs obligatoires
- [ ] Message "Veuillez remplir tous les champs" en français

### 1.8 Vérification d'Âge
- [ ] Page de vérification d'âge s'affiche
- [ ] Confirmation "J'ai 18 ans ou plus" requise
- [ ] Vérification avec pièce d'identité possible
- [ ] Texte avec accents (Vérification, Majeur) affiche correctement

---

## 👤 Section 2: Gestion du Profil

### 2.1 Affichage du Profil
- [ ] Photos utilisateur s'affichent correctement
- [ ] Nom et bio s'affichent
- [ ] Accents dans nom/bio corrects (François, José)
- [ ] Genre affiche la traduction correcte
- [ ] Âge calculé correctement
- [ ] Badge "Vérifié" affiche si applicable
- [ ] Intérêts affichent correctement

### 2.2 Modification du Profil
- [ ] Page d'édition se charge
- [ ] Édition du prénom fonctionne avec accents
- [ ] Édition du nom de famille fonctionne
- [ ] Édition de la bio fonctionne (caractères spéciaux inclus)
- [ ] Édition du genre fonctionne
- [ ] Édition de la date de naissance fonctionne
- [ ] Sauvegarde réussie affiche: "Profil mis à jour"
- [ ] Erreur de sauvegarde affiche message français correct
- [ ] Changement de mot de passe fonctionne
- [ ] Ancien mot de passe validé correctement

### 2.3 Gestion des Photos
- [ ] Galerie de photos se charge
- [ ] Ajout de photo depuis la galerie fonctionne
- [ ] Prise de photo avec caméra fonctionne
- [ ] Limite de 6 photos appliquée
- [ ] Message "Limite atteinte" en français
- [ ] Suppression de photo fonctionne
- [ ] Confirmation de suppression requise
- [ ] Photos se sauvegardent en base de données

### 2.4 Voir Profil d'Autres Utilisateurs
- [ ] Profil d'un autre utilisateur se charge
- [ ] Photos affichent correctement
- [ ] Bio avec accents s'affiche
- [ ] Badge "Vérifié" affiche si applicable
- [ ] Distance affiche correctement
- [ ] Bouton "Envoyer un message" fonctionne
- [ ] Bouton "Ajouter aux favoris" fonctionne
- [ ] Bouton "Bloquer" fonctionne

### 2.5 Suppression de Compte
- [ ] Page de suppression de compte se charge
- [ ] Avertissement en français s'affiche
- [ ] Confirmation requise
- [ ] Nouvelle connexion après suppression impossible
- [ ] Données supprimées de la base de données
- [ ] Redirection vers landing page

---

## 💘 Section 3: Découverte et Correspondances

### 3.1 Page Découvrir
- [ ] Page se charge avec profils
- [ ] Cartes de profil s'affichent
- [ ] Photo principale affiche correctement
- [ ] Nom et âge affichent
- [ ] Distance affiche correctement
- [ ] Badge "Vérifié" affiche
- [ ] Bio avec accents s'affiche correctement

### 3.2 Actions sur les Profils
- [ ] Bouton "J'aime" fonctionne
- [ ] Bouton "Super J'aime" fonctionne
- [ ] Bouton "Passer" fonctionne
- [ ] Actions mettent à jour la base de données
- [ ] Undo affiche après action
- [ ] Message "NOUVELLE CORRESPONDANCE" s'affiche quand match
- [ ] Accents dans messages corrects

### 3.3 Filtres de Découverte
- [ ] Page de filtres s'affiche
- [ ] Filtre par âge fonctionne
- [ ] Filtre par distance fonctionne
- [ ] Filtre par genre fonctionne
- [ ] Filtre par intérêts fonctionne
- [ ] Filtre par statut de vérification fonctionne
- [ ] Sauvegarde des filtres fonctionne
- [ ] Application des filtres affiche résultats corrects
- [ ] "Aucun profil disponible" en français si vide

### 3.4 Correspondances (Matches)
- [ ] Page des correspondances se charge
- [ ] Liste des correspondances s'affiche
- [ ] Cliquer sur une correspondance ouvre le profil
- [ ] Bouton "Envoyer un message" fonctionne
- [ ] Bouton "Retirer la correspondance" fonctionne
- [ ] Confirmation avant suppression en français
- [ ] "Aucune correspondance" message correct
- [ ] Photos et noms avec accents affichent

### 3.5 Page Profil Détaillé
- [ ] Photos en galerie fonctionnent
- [ ] Swipe entre photos fonctionne
- [ ] Bio complète avec accents s'affiche
- [ ] Intérêts affichent
- [ ] Localisation affiche
- [ ] Vérification affiche
- [ ] Boutons d'action (Like, Message, Block) fonctionnent

---

## 💬 Section 4: Messagerie et Chat

### 4.1 Liste des Chats
- [ ] Page des messages se charge
- [ ] Liste des conversations s'affiche
- [ ] Dernier message affiche avec accents
- [ ] Statut online/offline affiche correctement
- [ ] Heure du dernier message affiche
- [ ] Cliquer ouvre la conversation
- [ ] "Aucun message" message en français

### 4.2 Conversation Individuelle
- [ ] Messages se chargent
- [ ] Historique des messages affiche
- [ ] Messages avec accents s'affichent correctement
- [ ] Horodatage affiche
- [ ] Envoi de message fonctionne
- [ ] Placeholder "Tapez un message" en français
- [ ] Statut de livraison affiche
- [ ] Notification quand nouveau message reçu

### 4.3 Actions dans le Chat
- [ ] Clic long sur message pour options
- [ ] Suppression de message fonctionne
- [ ] Édition de message fonctionne (si implémenté)
- [ ] Réaction aux messages fonctionne (si implémenté)
- [ ] Blocage d'utilisateur depuis chat fonctionne
- [ ] Déblocage d'utilisateur fonctionne
- [ ] Suppression de conversation fonctionne
- [ ] Confirmation en français requise

### 4.4 Caractères Spéciaux dans Messages
- [ ] Messages avec accents français: "Ça va bien, j'ai reçu votre message"
- [ ] Messages avec caractères allemands: "Grüße"
- [ ] Messages avec caractères espagnols: "Hasta mañana"
- [ ] Messages avec emojis: "J'aime 👍"
- [ ] Messages avec caractères unicode: "中文, 日本語, 한국어"
- [ ] URLs dans messages fonctionnent
- [ ] @ mentions s'affichent correctement

---

## ⭐ Section 5: Fonctionnalités Premium

### 5.1 Page Premium
- [ ] Page premium se charge
- [ ] Prix $12.99/month USD affiche
- [ ] "7-day free trial" affiche
- [ ] Trois avantages listés:
  - [ ] Accès complet aux profils
  - [ ] Messagerie illimitée
  - [ ] Localisation précise
- [ ] Lien d'achat Stripe fonctionne
- [ ] Texte avec accents correct

### 5.2 Fonctionnalités Premium Actives
- [ ] Utilisateur premium peut voir tous les profils
- [ ] Profils premium ont messagerie illimitée
- [ ] Badge premium affiche sur profil
- [ ] Localisation plus précise activée
- [ ] Anciens profils affichent plus de détails

### 5.3 Gestion Premium
- [ ] Affichage du statut premium
- [ ] Affichage de la date d'expiration
- [ ] Annulation possible
- [ ] Réactivation possible
- [ ] Reçu de paiement affiche

### 5.4 Page "Liked" (Qui vous a aimé)
- [ ] Page des utilisateurs qui vous ont aimé se charge
- [ ] Liste avec photos et noms affiche
- [ ] Noms avec accents s'affichent
- [ ] Bouton pour like/match affiche
- [ ] Feature lock si premium non actif

---

## 📢 Section 6: Activité et Notifications

### 6.1 Page Activité
- [ ] Page se charge
- [ ] Activité "A aimé votre profil" affiche
- [ ] Activité "A visité votre profil" affiche
- [ ] Activité "Nouvelle correspondance" affiche
- [ ] Clic sur activité ouvre le profil
- [ ] Horodatage affiche ("Il y a 2 minutes")
- [ ] "Aucune activité" message en français

### 6.2 Notifications
- [ ] Notifications push activées
- [ ] Notification quand nouveau match
- [ ] Notification quand nouveau message
- [ ] Notification quand quelqu'un aime votre profil
- [ ] Notification quand quelqu'un visite profil
- [ ] Accents dans notifications corrects
- [ ] Clic sur notification ouvre la page appropriée

### 6.3 Paramètres de Notifications
- [ ] Toggle for messages notifications
- [ ] Toggle for likes notifications
- [ ] Toggle for matches notifications
- [ ] Paramètres sauvegardés

---

## ⚙️ Section 7: Paramètres et Comptes

### 7.1 Page Paramètres
- [ ] Page se charge
- [ ] Sections listées:
  - [ ] Paramètres du compte
  - [ ] Paramètres de confidentialité
  - [ ] Paramètres de notification
- [ ] Bouton "Se déconnecter" fonctionne
- [ ] Bouton "Supprimer le compte" visible
- [ ] Texte en français correct

### 7.2 Paramètres de Compte
- [ ] Affichage email
- [ ] Option pour changer mot de passe
- [ ] Changement de langue fonctionne
- [ ] Changement de pays fonctionne
- [ ] Sauvegarde fonctionne

### 7.3 Paramètres de Confidentialité
- [ ] Contrôle de qui peut vous voir
- [ ] Contrôle de qui peut vous envoyer des messages
- [ ] Contrôle de qui peut vous aimer
- [ ] Paramètres de localisation précise
- [ ] Sauvegarde fonctionne

### 7.4 Paramètres de Notification
- [ ] Toggle pour notifications messages
- [ ] Toggle pour notifications likes
- [ ] Toggle pour notifications matches
- [ ] Toggle pour notifications activité
- [ ] Sons de notification contrôlables
- [ ] Vibration contrôlable

---

## 🔒 Section 8: Vérification et Sécurité

### 8.1 Vérification d'Identité
- [ ] Processus de vérification s'affiche
- [ ] Types de documents acceptés listés
- [ ] Téléchargement de document fonctionne
- [ ] Comparaison faciale fonctionne (si implémenté)
- [ ] Selfie de confirmation s'enregistre
- [ ] Vérification réussie affiche badge
- [ ] Messages d'erreur en français corrects

### 8.2 Blocage et Signalement
- [ ] Bouton "Bloquer" fonctionne
- [ ] Utilisateur bloqué n'apparaît plus en découverte
- [ ] Déblocage possible depuis paramètres
- [ ] Signalement d'utilisateur possible
- [ ] Messages en français corrects

### 8.3 Sécurité des Données
- [ ] Mot de passe crypté en transmission (HTTPS)
- [ ] Données personnelles protégées
- [ ] Photos sécurisées
- [ ] Token d'authentification sécurisé
- [ ] Déconnexion nettoie les données locales

### 8.4 Politique de Confidentialité et Conditions
- [ ] Lien vers Politique de Confidentialité fonctionnent
- [ ] Page de Politique se charge complètement
- [ ] Lien vers Conditions d'Utilisation fonctionne
- [ ] Page de Conditions se charge complètement
- [ ] Texte avec accents s'affiche
- [ ] Signatures et dates affichent

---

## 🌍 Section 9: Localisation et Géolocalisation

### 9.1 Services de Localisation
- [ ] Application demande permission de localisation
- [ ] Permission accordée permet la localisation
- [ ] Distance entre utilisateurs calculée correctement
- [ ] Localisation se met à jour régulièrement
- [ ] Utilisateurs proches affichent en premier

### 9.2 Gestion des Permissions
- [ ] Permission refusée gère l'erreur
- [ ] Message "Veuillez activer les services de localisation" en français
- [ ] Redirection vers paramètres système possible
- [ ] Nouvelle tentative après permission accordée

### 9.3 Changement de Localisation
- [ ] Changement de pays fonctionne
- [ ] Nouveaux profils affichent après changement
- [ ] Filtres de distance se réinitialisent
- [ ] Historique de localisation pas visible pour les autres

---

## 🌐 Section 10: Caractères Spéciaux et Traductions

### 10.1 Français (FR)
- [ ] Tous les textes UI affichent correctement
- [ ] Accents: é, è, ê, à, ù, ç affichent
- [ ] Apostrophes: "l'erreur", "d'accord" affichent
- [ ] Messages d'erreur: "L'opération a échoué"
- [ ] Noms propres français: François, Élève, Périgord
- [ ] Texte brut avec accents: bio, descriptions

### 10.2 Allemand (DE)
- [ ] Caractères: ä, ö, ü, ß affichent
- [ ] Exemples: "Grüße", "Größe", "Übung"
- [ ] Messages d'erreur en allemand corrects

### 10.3 Espagnol (ES dans Portugal PT)
- [ ] Caractères: ñ, á, é, í, ó, ú affichent
- [ ] Exemples: "Mañana", "Español"

### 10.4 Portugais (PT)
- [ ] Caractères: ã, õ, ç, é affichent
- [ ] Exemples: "São Paulo", "Pão"

### 10.5 Mandarin (ZH)
- [ ] Caractères chinois affichent correctement
- [ ] Exemple: "欢迎来到 NearMe"

### 10.6 Coréen (KO)
- [ ] Caractères coréens affichent correctement
- [ ] Exemple: "NearMe에 오신 것을 환영합니다"

### 10.7 Japonais (JA)
- [ ] Caractères japonais (hiragana, katakana, kanji) affichent
- [ ] Exemple: "NearMeへようこそ"

### 10.8 Transmission de Caractères Spéciaux
- [ ] Bio avec accents: "J'adore l'informatique" transmise correctement
- [ ] Prénoms: François, José, Müller transmis correctement
- [ ] Messages: "Ça va? C'est génial!" transmis correctement
- [ ] URLs avec caractères spéciaux gérés

---

## 📱 Section 11: Expérience Multi-Plateforme

### 11.1 Web (Navigateur)
- [ ] Application se charge sur Chrome
- [ ] Application se charge sur Firefox
- [ ] Application se charge sur Safari
- [ ] Responsive sur desktop (1920x1080)
- [ ] Responsive sur tablet (768x1024)
- [ ] Toutes les fonctionnalités disponibles
- [ ] Accents s'affichent correctement

### 11.2 iOS (Expo)
- [ ] Application se lance
- [ ] Tous les écrans accessibles
- [ ] Photos se chargent depuis galerie
- [ ] Caméra fonctionne
- [ ] Notifications se reçoivent
- [ ] Localisation fonctionne
- [ ] Accents s'affichent correctement
- [ ] Swipe et gestes fonctionnent

### 11.3 Android (Expo)
- [ ] Application se lance
- [ ] Tous les écrans accessibles
- [ ] Photos se chargent depuis galerie
- [ ] Caméra fonctionne
- [ ] Notifications se reçoivent
- [ ] Localisation fonctionne
- [ ] Accents s'affichent correctement
- [ ] Swipe et gestes fonctionnent

### 11.4 Performance
- [ ] Chargement de page < 2 secondes
- [ ] Scroll lisse (60 FPS)
- [ ] Pas de lag lors d'actions
- [ ] Photos chargent rapidement
- [ ] Chat se charge rapidement
- [ ] Pas de crashes

---

## 🚀 Section 12: Cas Limites et Erreurs

### 12.1 Gestion des Erreurs Réseau
- [ ] Pas de connexion affiche "Erreur réseau"
- [ ] Timeout affiche message correct
- [ ] Reconnexion automatique fonctionne
- [ ] Messages d'erreur en français

### 12.2 Gestion des Erreurs Firebase
- [ ] Auth/email-already-in-use: "Cet email est déjà utilisé"
- [ ] Auth/wrong-password: "Identifiants invalides"
- [ ] Auth/user-not-found: "Aucun compte trouvé"
- [ ] Permission-denied: "Vous n'avez pas la permission"
- [ ] Tous les messages en français

### 12.3 Cas Limites d'Entrée
- [ ] Email très long: accepté ou rejeté correctement
- [ ] Bio très longue: tronquée ou gérée
- [ ] Mot de passe très long: accepté
- [ ] Caractères spéciaux dans mot de passe: élève@123!
- [ ] Emojis dans bio: 👍😊✨ affichent correctement
- [ ] Caractères unicode rares gérés

### 12.4 Cas Limites de Données
- [ ] Utilisateur sans photos
- [ ] Utilisateur sans bio
- [ ] Utilisateur sans intérêts
- [ ] Chat avec très peu de messages
- [ ] Chat avec très beaucoup de messages (1000+)
- [ ] Utilisateur avec 0 correspondances
- [ ] Utilisateur avec 100+ correspondances

### 12.5 Cas de Concurrence
- [ ] Deux like simultanés
- [ ] Like + Pass simultanés
- [ ] Deux messages simultanés
- [ ] Édition de profil + modification base de données
- [ ] Suppression + like simultanés

---

## 📊 Section 13: Analytics et Logs

### 13.1 Tracking des Actions
- [ ] Like/Pass trackés
- [ ] Messages trackés
- [ ] Vues de profil trackées
- [ ] Complétion d'inscription trackée
- [ ] Activité premium trackée

### 13.2 Logs d'Erreur
- [ ] Erreurs loggées en console
- [ ] Erreurs envoyées au service de log
- [ ] Contexte d'erreur sauvegardé
- [ ] Timestamps corrects

---

## ✅ Résumé de la Checklist

**Total des éléments:** ~350 items

**Pour chaque test:**
1. ✅ Cocher si test réussi
2. ❌ Marquer si échec et ajouter détails
3. 🐛 Créer issue GitHub si bug
4. 📝 Noter les observations

---

## 🎓 Instructions de Test

### Avant le test:
1. Installer l'app fraîchement (`npm install` + `expo start`)
2. Tester sur au moins 2 plateformes (Web + Mobile)
3. Tester avec au moins 2 comptes utilisateurs
4. Tester chaque langue (FR en priorité)

### Pendant le test:
1. Tester les cas heureux (happy path)
2. Tester les cas d'erreur (sad path)
3. Tester les cas limites (edge cases)
4. Documenter tous les problèmes

### Après le test:
1. Créer des issues pour chaque bug
2. Prioriser par impact (critique, majeur, mineur)
3. Assigner aux développeurs
4. Réexécuter les tests après fixes

---

## 📞 Contacts et Escalade

- **Bugs critiques:** Signaler immédiatement
- **Bugs majeurs:** Créer issue GitHub
- **Questions:** Demander à l'équipe développement
