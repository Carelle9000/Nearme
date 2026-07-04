# Guide complet : Configuration Google Play Billing

Ce guide couvre toutes les étapes nécessaires après l'intégration du code pour que Google Play Billing fonctionne en production.

---

## ✅ Étape 1 : Créer le produit dans Google Play Console

### 1.1 Accéder à Play Console

1. Allez sur https://play.google.com/console
2. Sélectionnez votre application **NearMe** (que vous avez créée précédemment)
3. Allez dans **Monétisation** (à gauche)

### 1.2 Créer un abonnement

1. Cliquez sur **Produits** → **Abonnements**
2. Cliquez sur **+ Créer un abonnement**

**Formulaire à remplir :**

| Champ | Valeur |
|---|---|
| **ID du produit** | `com.nearme.app.premium.monthly` |
| **Nom** | Premium - Monthly |
| **Description** | Access all premium features for one month |
| **Prix de base** | 12,99 USD |

3. **Sélectionner la devise** : Pour chaque pays/région, le prix s'ajuste automatiquement

### 1.3 Configurer l'essai gratuit

1. Dans le même formulaire, allez à la section **Période d'essai gratuit**
2. Cochez **Activer l'essai gratuit**
3. Définissez la durée : **7 jours**

### 1.4 Configuration de renouvellement

Ces paramètres doivent être par défaut, vérifiez-les :

| Paramètre | Valeur |
|---|---|
| **Renouvellement automatique** | ✅ Activé |
| **Annulation par l'utilisateur** | ✅ Autorisée |
| **Délai avant annulation** | 0 jours (l'utilisateur peut annuler tout de suite) |

### 1.5 Paramètres avancés (optionnel mais recommandé)

- **Grace period** (période de grâce) : **3 jours** — si le renouvellement échoue, Play Billing réessaiera pendant 3 jours avant d'annuler
- **Account hold** (maintien du compte) : **7 jours** — après une défaillance de paiement, l'accès reste jusqu'à 7 jours

### 1.6 Sauvegarder

Cliquez sur **Créer le produit**

✅ L'abonnement est créé. Il sera d'abord en **brouillon** (visibles uniquement pour les testeurs), puis passera à **actif** après la première soumission en production.

---

## ✅ Étape 2 : Activer l'API Google Play Developer

### 2.1 Lier votre compte GCP

**Important** : Votre projet Firebase = votre projet Google Cloud Platform (GCP). Ils sont déjà liés.

1. Allez sur https://console.cloud.google.com
2. En haut, sélectionnez votre **projet GCP** (même projet que Firebase `nearme-bd95a`)
3. Vérifiez le nom du projet : il doit dire `nearme-bd95a` ou similaire

### 2.2 Activer l'API Android Publisher

1. Dans GCP Console, allez à **APIs & Services** → **Bibliothèque**
2. Recherchez : **Android Publisher API**
3. Cliquez sur le résultat
4. Cliquez sur **Activer**

Attendez ~30 secondes que l'API s'active.

### 2.3 Créer un compte de service

Le compte de service est l'identité sous laquelle votre Cloud Function s'authentifie auprès de Google Play API.

1. Allez à **APIs & Services** → **Identifiants** (Credentials)
2. Cliquez sur **+ Créer des identifiants** → **Compte de service**

**Formulaire à remplir :**

```
Nom du compte de service : firebase-billing-service
Description : Service account for validating Google Play purchases in Cloud Functions
```

Cliquez sur **Créer**

### 2.4 Donner au compte de service le rôle "Éditeur Play Console"

Le compte de service doit avoir la permission de **lire** les informations d'achat depuis Google Play API.

1. Retournez à **APIs & Services** → **Identifiants**
2. Cliquez sur le compte de service que vous venez de créer
3. Allez à l'onglet **Rôles et administrateurs**
4. Cliquez sur **Ajouter une attribution de rôle** ou **Modifier les rôles**
5. Recherchez et sélectionnez : **Éditeur Play Console** (ou `roles/play.developer`)

Cliquez sur **Enregistrer**

### 2.5 Vérifier que la Cloud Function utilise les bonnes credentials

La Cloud Function Firebase utilise **Application Default Credentials (ADC)** automatiquement.

Quand votre Cloud Function tourne sur Google Cloud Run (ce que fait Firebase), elle a automatiquement accès au compte de service du projet. Vous n'avez rien à faire de spécial.

**Vérification :**
```bash
# Depuis votre terminal, allez dans le répertoire functions
cd /c/Users/DELL5500/Desktop/nearme/functions

# Listez le compte de service actuel
gcloud auth list
```

Si vous voyez un compte de service au lieu de votre email, c'est bon. ✅

---

## ✅ Étape 3 : Builder et tester

### 3.1 Pré-requis

Avant de builder, assurez-vous que :

✅ `google-services.json` est à la racine du projet (depuis l'étape du déploiement Play Console)  
✅ `eas.json` existe (créé précédemment)  
✅ Vous avez un compte **Expo** (créé lors de `eas login`)  

### 3.2 Build preview APK

Le profil **preview** génère un APK (plus rapide) au lieu d'un AAB (pour la production).

```bash
cd /c/Users/DELL5500/Desktop/nearme

# Build preview APK (accessible publiquement via un lien)
eas build --platform android --profile preview
```

**Pendant la compilation (~40 min)** :
- EAS fait checkout du code
- Prébuild le projet Android
- Compile les dépendances natives
- Produit un APK signé
- Affiche un lien de téléchargement

**À la fin, vous verrez** :
```
✅ Build finished
📱 APK download link: https://expo.dev/accounts/...
```

**Gardez ce lien**, vous en aurez besoin.

### 3.3 Configurer des comptes de test dans Play Console

Les **comptes de test** peuvent effectuer des achats gratuits pour tester le flux sans être facturés.

1. Allez dans Play Console → **Paramètres** → **Comptes de test**
2. Cliquez sur **+ Ajouter des comptes de test**
3. Entrez l'adresse e-mail d'un compte Google que vous contrôlez
   - Exemple : `votre-email+test@gmail.com`
   - **Important** : Ce compte ne doit pas être un compte Google Play actuel (créez en un nouveau si besoin)
4. Cliquez sur **Ajouter**

Le compte est maintenant autorisé à faire des achats de test gratuits.

**Vérification** : Le compte de test verra les prix comme "$0.00" dans Play Console, et il ne sera jamais facturé.

### 3.4 Installer l'APK sur un appareil Android réel

**L'émulateur Android Studio ne marche PAS pour tester Play Billing** (limitation de Google).
Vous DEVEZ un appareil physique.

#### Option A : Télécharger via le lien EAS

1. Depuis le lien EAS fourni à la fin du build, téléchargez l'APK
2. Envoyez le fichier `.apk` à votre appareil
3. Sur l'appareil, ouvrez le fichier → **Installer**

#### Option B : Installer via ADB (ligne de commande)

```bash
# Sur votre machine, avec Android SDK installé
adb install /path/to/nearme.apk

# Vérifier que l'app est installée
adb shell pm list packages | grep nearme
```

### 3.5 Configuration sur l'appareil Android

Avant de tester, configurez l'appareil pour utiliser votre compte de test :

1. Sur l'appareil Android, allez à **Paramètres** → **Comptes**
2. Cliquez sur **Ajouter un compte** → **Google**
3. Entrez l'adresse e-mail du compte de test (exemple : `votre-email+test@gmail.com`)
4. Complétez la vérification 2FA et configurez le compte
5. Allez à **Paramètres** → **Google Play** → vérifiez que le compte de test est sélectionné

### 3.6 Tester le flux complet

Lancez l'app sur votre appareil :

```bash
# Dans le terminal
eas build --platform android --profile preview --wait
# Puis installez l'APK téléchargé
```

**Flux à tester :**

#### Test 1 : Achat réussi

1. Ouvrez l'app NearMe
2. Connexion avec un compte de test
3. Allez à **Premium** → **S'abonner**
4. Le **paywall Google Play** s'ouvre (bottom sheet native)
5. Confirmez l'achat avec le compte de test
6. **Attendez 3-5 secondes** que la Cloud Function valide
7. Vous devez voir : ✅ **"Succès - Vous êtes maintenant abonné au premium"**
8. L'écran devrait afficher **"Vous êtes premium"**

#### Test 2 : Restauration d'achats

1. Connectez-vous avec le MÊME compte de test
2. Allez à **Premium** → **Restaurer les achats** (ou retry)
3. L'app doit récupérer votre achat précédent
4. Afficher : ✅ **"Votre abonnement a été restauré"**

#### Test 3 : Annulation

1. Sur votre appareil, allez à **Google Play Store**
2. Profil → **Abonnements et achats** → **Abonnements**
3. Sélectionnez **NearMe** → **Gérer l'abonnement**
4. Cliquez sur **Annuler l'abonnement**
5. Relancez l'app → vérifiez que le statut premium **disparaît** après sync RTDB

### 3.7 Vérifications dans Firebase

Pendant et après un achat, vérifiez l'état dans Firebase Console :

1. Allez sur https://console.firebase.google.com → **nearme-bd95a**
2. **Realtime Database** → onglet **Data**
3. Naviguez à : `profiles/{uid}/premium`
4. Vous devez voir :
   ```json
   {
     "isActive": true,
     "tier": "premium",
     "startDate": "2026-07-04T...",
     "expiryDate": "2026-08-04T...",
     "autoRenew": true,
     "purchaseToken": "...",
     "productId": "com.nearme.app.premium.monthly"
   }
   ```

5. Si vide ou absent → **l'achat n'a pas été validé** (voir troubleshooting ci-dessous)

### 3.8 Vérifier les logs de la Cloud Function

Si quelque chose échoue, consultez les logs :

```bash
# Afficher les 50 derniers logs de la Cloud Function
firebase functions:log
```

Ou dans Firebase Console :
1. **Functions** (à gauche)
2. Cliquez sur **validateGooglePlayPurchase**
3. Onglet **Logs**

Cherchez les erreurs comme :
- `"Achat non trouvé"` → purchaseToken invalide
- `"L'achat n'a pas été confirmé"` → paiement non accepté par Google
- `"Erreur lors de la validation du paiement"` → problème API Google Play

---

## ✅ Étape 4 : Déployer la Cloud Function en production

### 4.1 Prérequis de déploiement

```bash
# Installez Firebase CLI s'il ne l'est pas
npm install -g firebase-tools

# Connectez-vous à votre compte Firebase
firebase login

# Vérifiez que vous êtes dans le bon projet
cd /c/Users/DELL5500/Desktop/nearme
firebase projects:list
# Doit afficher votre projet nearme-bd95a
```

### 4.2 Déployer la Cloud Function

```bash
# Depuis la racine du projet
firebase deploy --only functions

# Ou seulement la fonction billing (plus rapide si vous ne changez que celle-là)
firebase deploy --only functions:validateGooglePlayPurchase
```

**Pendant le déploiement (~2 min)** :
- Firebase compile le TypeScript en JavaScript
- Empaquette les dépendances
- Pousse vers Google Cloud
- Active la fonction

**À la fin**, vous verrez :
```
✅ Function deployed successfully
✔ functions[validateGooglePlayPurchase(europe-west1)]
```

### 4.3 Vérifier le déploiement

```bash
# Listez toutes les Cloud Functions déployées
firebase functions:list

# Vous devez voir :
# ✔  validateGooglePlayPurchase(europe-west1)
```

Ou dans Firebase Console :
1. **Functions** (à gauche)
2. Vous devez voir **validateGooglePlayPurchase** avec un statut **Routage actif** (vert)

### 4.4 Tester la fonction en ligne

Dans Firebase Console → **Functions** → **validateGooglePlayPurchase** :

1. Cliquez sur l'onglet **Testing**
2. Entrez un test d'exemple (facultatif, juste pour vérifier que la fonction est accessible)

Alternativement, après avoir compilé et installé l'APK production, l'app appellera la fonction automatiquement lors d'un achat.

---

## 🔧 Troubleshooting

### Problème : "L'achat a échoué" ou "Non authentifié"

**Cause** : L'app n'est pas loggée correctement

**Solution** :
1. Assurez-vous d'être connecté dans l'app avec le compte de test Google Play
2. Vérifiez que Firebase Authentication a un utilisateur actif
3. Relancez l'app

### Problème : "Achat non trouvé" (Cloud Function log)

**Cause** : Le `purchaseToken` est invalide ou expiré

**Solution** :
1. Vérifiez que le produit `com.nearme.app.premium.monthly` existe dans Play Console
2. Vérifiez que le `packageName` dans `functions/src/billing.ts` est correct : `com.nearme.app`
3. Re-testez l'achat

### Problème : "L'achat n'a pas été confirmé" (code d'erreur paymentState incorrect)

**Cause** : L'achat n'est pas encore validé par Google Play

**Solution** :
1. Attendez 30 secondes après l'achat
2. Relancez l'app
3. Cliquez sur **Restaurer les achats** (cela force un re-check)

### Problème : Premium ne s'active pas après l'achat

**Cause** : La Cloud Function n'a pas été appelée ou a échoué

**Solution** :
1. Vérifiez les logs Firebase : `firebase functions:log`
2. Assurez-vous que `validateGooglePlayPurchase` est déployée : `firebase functions:list`
3. Vérifiez que le `package.json` des functions a `googleapis` : `npm list googleapis`
4. Re-déployez : `firebase deploy --only functions`

### Problème : L'API Android Publisher n'est pas active

**Cause** : Vous avez oublié d'activer l'API dans GCP

**Solution** :
1. https://console.cloud.google.com
2. **APIs & Services** → **Bibliothèque**
3. Recherchez **Android Publisher API**
4. Cliquez sur **Activer**

### Problème : Permission denied (l'API rejette la requête)

**Cause** : Le compte de service n'a pas le rôle "Éditeur Play Console"

**Solution** :
1. https://console.cloud.google.com → **IAM & Admin**
2. Trouvez le compte de service `firebase-billing-service`
3. Cliquez sur **Éditer**
4. Ajouter le rôle : **Éditeur Play Console** (ou `roles/play.developer`)
5. **Enregistrer**
6. Attendez 5 minutes que la permission se propage
7. Re-testez

---

## ✅ Checklist finale avant la production

- [ ] L'abonnement `com.nearme.app.premium.monthly` existe dans Play Console (ID produit exact)
- [ ] API Android Publisher activée dans GCP Console
- [ ] Compte de service créé et avec rôle "Éditeur Play Console"
- [ ] `google-services.json` à la racine du projet
- [ ] Cloud Function `validateGooglePlayPurchase` déployée et opérationnelle
- [ ] APK preview construit et testé sur un appareil réel
- [ ] Achat de test réussi : le statut premium s'active en RTDB
- [ ] Restauration d'achats fonctionnelle
- [ ] RTDB rules protègent le nœud `premium` (write backend only)
- [ ] Les logs de la Cloud Function ne montrent aucune erreur

---

## 📊 Flux complet après configuration

```
1. Utilisateur ouvre l'app → Premium screen
2. Appuie sur "S'abonner"
3. ↓
4. iapService.purchaseSubscription()
5. ↓
6. Google Play paywall s'ouvre (OS native)
7. Utilisateur confirme → Google Play traite le paiement
8. ↓
9. purchaseUpdatedListener déclenché
10. ↓
11. iapService.validateAndActivate()
12. ↓
13. Appelle Cloud Function validateGooglePlayPurchase
14. ↓
15. Cloud Function valide via Google Play Developer API
16. ↓
17. Si valide → écrit dans RTDB : profiles/{uid}/premium.isActive = true
18. ↓
19. App détecte le changement RTDB
20. ↓
21. UI se rafraîchit : "Vous êtes premium"
22. ↓
23. utilisateur a accès aux features premium
```

C'est prêt ! 🚀
