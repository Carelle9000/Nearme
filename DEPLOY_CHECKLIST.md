# ✅ Checklist Déploiement Google Play Console

**Objectif** : Déployer NearMe sur Google Play Console de manière sécurisée et testée.

**Durée totale estimée** : 3-4 heures (incluant les builds)

---

## 🎯 Phase 1 : Vérification préalable (15 minutes)

### 1.1 Vérifier votre compte Google Play Console

- [ ] Allez sur https://play.google.com/console
- [ ] Connectez-vous avec votre compte Google
- [ ] Vérifiez que vous pouvez voir votre application **NearMe**
  - Si elle n'existe pas, créez-la d'abord (voir `DEPLOYMENT_GUIDE.md`)
- [ ] Notez votre **Package Name** : `com.nearme.app`

### 1.2 Vérifier votre compte Google Cloud Console

- [ ] Allez sur https://console.cloud.google.com
- [ ] En haut, sélectionnez votre projet GCP
- [ ] Le projet doit s'appeler : `nearme-bd95a` (ou similaire)
- [ ] **Important** : C'est le MÊME projet que votre Firebase

### 1.3 Vérifier les fichiers du projet

Dans le répertoire `/c/Users/DELL5500/Desktop/nearme`, vérifiez que vous avez :

```bash
# Ouvrez PowerShell et naviguez au projet
cd c:\Users\DELL5500\Desktop\nearme

# Vérifiez ces fichiers existent
ls app.json                    # ✅ Config Expo
ls google-services.json        # ✅ Firebase Android config (TRÈS IMPORTANT)
ls eas.json                    # ✅ Config EAS Build
ls functions/src/billing.ts    # ✅ Cloud Function
ls src/services/iap.service.ts # ✅ Service Play Billing
```

⚠️ **Si `google-services.json` n'existe pas** :
1. Allez sur https://console.firebase.google.com
2. Sélectionnez le projet `nearme-bd95a`
3. Paramètres → Intégrations → Android
4. Téléchargez `google-services.json`
5. Placez-le à la racine du projet

---

## 🔌 Phase 2 : Configuration Google Cloud (20 minutes)

### 2.1 Activer l'API Android Publisher

1. Allez sur https://console.cloud.google.com
2. Sélectionnez votre projet `nearme-bd95a`
3. Dans la recherche (barre en haut), tapez : **Android Publisher API**
4. Cliquez sur le résultat
5. Cliquez sur **Activer** (gros bouton bleu)
6. Attendez 30 secondes

✅ **Vérification** : Le statut doit afficher "Actif" (vert)

### 2.2 Créer un compte de service

1. Dans Google Cloud Console, allez à **APIs & Services** → **Identifiants**
2. Cliquez sur **+ Créer des identifiants** → **Compte de service**
3. Remplissez le formulaire :
   ```
   Nom du compte de service : firebase-billing
   Description : Service account for Google Play Billing validation
   ```
4. Cliquez sur **Créer et continuer**
5. **Accorder l'accès (rôles)** :
   - Recherchez et sélectionnez : **Éditeur** (Editor)
   - Cliquez sur **Continuer**
6. Cliquez sur **Créer un compte** (ou **Finish**)
7. Le compte est créé ✅

### 2.3 Accorder le rôle "Play Console Editor" au compte de service

1. Allez à **APIs & Services** → **Identifiants**
2. Cherchez le compte de service que vous venez de créer : `firebase-billing@...`
3. Cliquez sur le **compte de service** pour l'ouvrir
4. Allez à l'onglet **Rôles et administrateurs** (ou **IAM**)
5. Cliquez sur **Ajouter une attribution de rôle**
6. Sélectionnez le rôle : **Play Console Editor** (ou recherchez `play.developer`)
7. Cliquez sur **Enregistrer**

✅ **Vérification** : Le rôle doit s'afficher avec un statut "Actif"

---

## 🎮 Phase 3 : Configuration Google Play Console (20 minutes)

### 3.1 Créer le produit abonnement

1. Allez sur https://play.google.com/console
2. Sélectionnez **NearMe**
3. Menu de gauche → **Monétisation** → **Abonnements**
4. Cliquez sur **+ Créer un abonnement**
5. Remplissez le formulaire **EXACTEMENT** comme ceci :

| Champ | Valeur |
|---|---|
| **ID du produit** | `com.nearme.app.premium.monthly` |
| **Nom** | Premium - Monthly |
| **Description** | Access all premium features for one month |
| **Prix de base** | 12.99 |
| **Devise** | USD |
| **Essai gratuit** | ☑ Coché |
| **Durée essai** | 7 jours |
| **Renouvellement auto** | ☑ Coché |
| **Annulation utilisateur** | ☑ Coché |

6. Cliquez sur **Créer le produit**
7. Attendez 5 secondes pour la confirmation

✅ **Vérification** : Vous devez voir l'abonnement dans la liste avec le statut "Brouillon"

### 3.2 Créer des comptes de test

1. Dans Play Console, allez à **Paramètres** → **Comptes de test**
2. Cliquez sur **+ Ajouter des comptes de test**
3. Entrez une adresse e-mail Google que vous contrôlez
   - **Exemples** :
     - `votre-email+nearme-test@gmail.com`
     - `votre-email+billing-test@gmail.com`
   - **Important** : Ne peut pas être votre compte Google Play actuel
4. Cliquez sur **Ajouter**
5. Attendez la confirmation

✅ **Vérification** : L'e-mail doit apparaître dans la liste avec le statut "Actif"

---

## 🚀 Phase 4 : Déployer la Cloud Function (5 minutes)

### 4.1 Installer Firebase CLI

```bash
npm install -g firebase-tools
```

### 4.2 Se connecter à Firebase

```bash
firebase login
```

Une fenêtre de navigateur s'ouvre. Connectez-vous avec votre compte Google (celui lié à Firebase).

### 4.3 Déployer la Cloud Function

```bash
cd c:\Users\DELL5500\Desktop\nearme

firebase deploy --only functions
```

**Attendez 2-3 minutes.**

Vous verrez :
```
✔ Function deployed successfully
✔ functions[validateGooglePlayPurchase(europe-west1)]

✔ Deploy complete!
```

✅ **Vérification** : La fonction est maintenant en production

### 4.4 Vérifier le déploiement

```bash
firebase functions:list
```

Vous devez voir :
```
✔ validateGooglePlayPurchase(europe-west1) - https://europe-west1-...
```

---

## 🏗️ Phase 5 : Builder l'APK Preview (45 minutes)

### 5.1 Builder avec EAS

```bash
cd c:\Users\DELL5500\Desktop\nearme

eas build --platform android --profile preview
```

**Pendant la compilation** :
- EAS télécharge les dépendances
- Compile le code
- Génère un APK signé
- Affiche un lien de téléchargement

**À la fin**, vous verrez quelque chose comme :
```
✅ Build finished
📱 Download APK: https://expo.dev/artifacts/...
```

**Gardez ce lien !!**

✅ **Vérification** : L'APK est prêt à être téléchargé

### 5.2 Télécharger l'APK

1. Cliquez sur le lien EAS fourni
2. Téléchargez le fichier `nearme-preview.apk`
3. Gardez-le dans un dossier accessible

---

## 📱 Phase 6 : Tester sur Android (30 minutes)

### 6.1 Configurer un appareil Android réel

**⚠️ Important** : Les émulateurs **NE MARCHENT PAS** pour Play Billing. Vous avez BESOIN d'un téléphone réel.

Sur votre téléphone Android :
1. Allez à **Paramètres** → **Comptes**
2. Cliquez sur **Ajouter un compte**
3. Sélectionnez **Google**
4. Connectez-vous avec votre **compte de test** (ex: `votre-email+nearme-test@gmail.com`)
5. Complétez la vérification 2FA

### 6.2 Installer l'APK

```bash
# Sur votre ordinateur
adb install c:\Users\DELL5500\Desktop\nearme-preview.apk
```

Attendez ~30 secondes.

✅ **Vérification** : L'app doit apparaître sur votre téléphone

### 6.3 Tester le flux d'achat complet

1. **Ouvrez l'app** sur votre téléphone
2. **Connectez-vous** avec un compte de test (différent du compte Play)
3. Allez à **Premium** → **S'abonner**
4. Le **paywall Google Play** s'ouvre (bottom sheet natif)
5. Appuyez sur **"S'abonner"** ou **"Essayer gratuitement"**
6. **Attendez 3-5 secondes**

**Résultat attendu** :
- ✅ Toast vert : "Succès - Vous êtes maintenant abonné au premium"
- ✅ L'écran affiche "Vous êtes premium"
- ✅ Les features premium sont débloquées

**Si ça échoue** :
1. Ouvrez les logs : `firebase functions:log`
2. Cherchez les erreurs
3. Consultez le troubleshooting dans `PLAY_BILLING_SETUP.md`

### 6.4 Tester la restauration

1. Fermez l'app complètement
2. Ouvrez-la à nouveau
3. Allez à **Premium** → **Restaurer les achats**
4. Vous devez voir : "Votre abonnement a été restauré"

### 6.5 Vérifier Firebase RTDB

1. Allez sur https://console.firebase.google.com
2. Sélectionnez `nearme-bd95a`
3. **Realtime Database** → **Data**
4. Cherchez `profiles/{uid}/premium`
5. Vous devez voir :
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

✅ **Vérification** : Tous les champs sont présents et corrects

---

## 🏆 Phase 7 : Builder pour la production (45 minutes)

Une fois les tests réussis, buildez l'APK de production :

### 7.1 Builder l'AAB (Android App Bundle)

```bash
cd c:\Users\DELL5500\Desktop\nearme

eas build --platform android --profile production
```

**Attendez 45 minutes.**

À la fin :
```
✅ Build finished
📦 Download AAB: https://expo.dev/artifacts/...
```

**Gardez ce lien !!**

### 7.2 Télécharger l'AAB

1. Cliquez sur le lien EAS fourni
2. Téléchargez le fichier `nearme-production.aab`
3. Gardez-le précieusement

---

## 📤 Phase 8 : Soumettre à Play Console - Piste de test interne (15 minutes)

### 8.1 Uploader l'AAB

1. Allez sur https://play.google.com/console
2. Sélectionnez **NearMe**
3. Menu de gauche → **Versions de test** → **Tests internes**
4. Cliquez sur **+ Créer une piste de test interne**
5. Remplissez :
   - **Nom** : `Internal Testing 1.0.0`
   - **Description** : `First internal testing build with Play Billing`

### 8.2 Uploader le fichier AAB

1. Dans la section **Fichiers**, cliquez sur **+ Ajouter un fichier**
2. Sélectionnez votre fichier `.aab` téléchargé
3. Attendez l'upload (~2 minutes)
4. Google valide le fichier

✅ **Vérification** : L'AAB doit être accepté (pas d'erreurs)

### 8.3 Ajouter les testeurs

1. Dans **Accès des testeurs**, cliquez sur **+ Ajouter des testeurs**
2. Sélectionnez votre **groupe de test** ou
3. Entrez l'adresse e-mail de votre compte de test : `votre-email+nearme-test@gmail.com`
4. Cliquez sur **Ajouter**

### 8.4 Générer le lien de test

1. Cherchez la section **Lien de test**
2. Copiez le lien : `https://play.google.com/apps/testing/com.nearme.app`
3. Ouvrez le lien dans le navigateur du **compte de test**
4. Cliquez sur **Devenir testeur**
5. Ouvrez Google Play Store
6. Cherchez **NearMe**
7. Le bouton doit dire **"Tester"** ou **"Installer"**

### 8.5 Tester la version publique

1. Installez l'app depuis Play Store (pas via APK direct)
2. Testez le flux d'achat
3. Vérifiez que tout fonctionne

✅ **Vérification** : L'app installée depuis Play Store doit avoir les mêmes permissions et fonctionnalités

---

## 🎉 Phase 9 : Remplir la fiche Play Store (Avant production)

### 9.1 Informations de base

1. **Fiche de l'application** → **Fiche**
2. Remplissez :
   - **Titre court** : NearMe
   - **Courte description** : Rencontrez des célibataires à proximité. Géolocalisé, vérification d'identité.
   - **Description complète** : (4000 caractères max - voir `DEPLOYMENT_GUIDE.md`)

### 9.2 Images et captures

Vous avez besoin de :
- ✅ **Icône app** : 512×512 PNG
- ✅ **Captures d'écran** : Min 2, max 8 (1080×1920)
- ✅ **Graphique de fonctionnalité** : 1024×500 PNG (optionnel mais recommandé)
- ✅ **Logo app** : 192×192 PNG

### 9.3 Catégorie et contenu

- **Catégorie** : Dating / Social
- **Contenu** : 18+ (app de rencontres)
- **Politique de confidentialité** : URL publique vers votre politique

### 9.4 Questionnaire de notation de contenu (IARC)

1. Remplissez le questionnaire (tous les paramètres)
2. Répondez **18+** (app de rencontres)
3. Acceptez les politiques Google

---

## 🚀 Phase 10 : Publier en production (5 minutes)

Une fois que vous êtes satisfait du test interne :

### 10.1 Créer une piste de production

1. Allez à **Versions de test** → **Production**
2. Cliquez sur **+ Créer une piste de production**
3. Sélectionnez le **même AAB** que pour les tests internes
4. Remplissez **Notes de version** :
   ```
   Version 1.0.0
   
   🎉 Première version lancée !
   
   ✨ Fonctionnalités :
   - Découverte par proximité
   - Chat en temps réel
   - Abonnement premium avec Google Play Billing
   - Vérification d'identité
   
   🔒 Sécurité améliorée
   ```

### 10.2 Examiner et accepter

1. Cliquez sur **Examiner**
2. Lisez tous les champs
3. Acceptez les politiques Google Play
4. Cliquez sur **Publier**

### 10.3 Attendre la revue

Google examine l'app (généralement **2-4 heures**).

Vous recevrez un email :
- ✅ Si approuvée : "Votre app a été publiée"
- ❌ Si rejetée : "Modifications requises" (suivez les instructions)

---

## ✅ Checklist complète

Copiez/collez cette checklist et cochez au fur et à mesure :

```
☐ Compte Play Console créé et actif
☐ google-services.json téléchargé et à la racine du projet
☐ API Android Publisher activée dans GCP
☐ Compte de service créé avec rôle "Play Console Editor"
☐ Abonnement com.nearme.app.premium.monthly créé dans Play Console
☐ Compte de test créé dans Play Console
☐ Cloud Function validateGooglePlayPurchase déployée
☐ APK preview buildé et testé sur appareil réel
  ☐ Achat réussi
  ☐ Premium s'active
  ☐ Firebase RTDB montre premium.isActive = true
  ☐ Restauration d'achats fonctionne
  ☐ Cloud Function logs sans erreur
☐ AAB production buildé
☐ AAB uploadé dans piste "Tests internes"
☐ Testeurs ajoutés à piste interne
☐ Lien de test généré et testé
☐ Fiche Play Store complétée
  ☐ Titre, description, images
  ☐ Politique de confidentialité
  ☐ Questionnaire IARC (18+)
☐ Version de production créée et examinée
☐ App publiée en production
☐ Email de confirmation reçu
☐ App visible sur Google Play Store
```

---

## 📞 Questions fréquentes

**Q: Combien ça coûte ?**
A: 0 $. Les frais sont sur les achats (Google prend 30%).

**Q: Combien de temps ça prend ?**
A: ~3-4h pour tout faire + ~2-4h pour la revue Google.

**Q: Faut-il un APK pour les tests internes ?**
A: Non, Play Console accepte les AAB directement.

**Q: Que faire si Play Console rejette l'app ?**
A: Lisez les raisons et mettez à jour selon les exigences (généralement 24-48h pour la revue à nouveau).

**Q: Comment tester après publication ?**
A: Restez un testeur interne (vous pouvez installer gratuitement du Play Store).

---

**Prêt ? Commencez par la Phase 1 ! 🚀**
