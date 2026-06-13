# Plan d'inspiration Heyama → NearMe
> Analyse ingénieur logiciel — juin 2026

---

## 1. Vue d'ensemble de Heyama

Heyama (Sendylo LLC, lancé juin 2023) est une app de rencontres ciblant la communauté africaine.  
**4,4 ★ — 250k+ téléchargements — 16k avis.**  
Stack inconnue côté serveur, mais le comportement UI laisse deviner React Native (transitions, shadows) + backend cloud centralisé sans offline-first.

Fonctionnalités phares :
- **NDOLO Search** : algorithme de matching culturel (origines, langue maternelle, plats locaux)
- **Photo verification automatique** à l'inscription
- **Chat avec messages vocaux**
- **Grille "Admirateurs"** (qui t'a liké)
- **Feed d'activité** (matchs récents, vues de profil)
- **Coaching relationnel** (conseils in-app)
- **Système de pièces (coins)** — monétisation

Points faibles identifiés dans les avis (à éviter) :
- Messages vocaux dans coins payants → frustration
- 1 DM/jour gratuit supprimé → churn
- Disparition de conversations → bug de sync
- Absence de barre de recherche de profils
- Notifications de match buguées

---

## 2. Analyse comparative avec NearMe

| Aspect | Heyama | NearMe (état actuel) |
|--------|--------|----------------------|
| Design | Chaud, coloré, afrocentrique | Dark violet premium, glassmorphic |
| Profile card | Photo réelle + badge vérifié | Emoji placeholder + chip glassmorphic |
| Onboarding | "Poste une annonce" + algo | Multi-step form classique |
| Matching | Algo culturel NDOLO → 10 profils | Local proximity-first |
| Chat | Texte + **messages vocaux** | Texte uniquement |
| Activité | **Grille admirateurs + feed** | Pas encore implémenté |
| Sécurité | Badge vérifié visible sur carte | `isFaceVerified` non affiché |
| Monetisation | Coins + achats | Stripe stub (non implémenté) |
| Coaching | Coaches relationnels | Absent |
| Sync | Centralisé (bugs constatés) | Offline-first Drift + SyncManager ✅ |

---

## 3. Plan d'implémentation — Design

### 3.1 Verified badge sur la ProfileCard

**Fichier cible :** `lib/features/discover/widgets/profile_card.dart`

Heyama affiche un badge bouclier bien visible sur chaque profil vérifié. Actuellement NearMe stocke `isFaceVerified` dans le modèle `Profile` mais ne l'affiche pas.

```dart
// Dans ProfileCard, dans la Row de la Positioned top (à côté du badge intention)
if (profile.isFaceVerified)
  _FrostedChip(
    color: AppColors.emerald.withValues(alpha: 0.20),
    borderColor: AppColors.emerald.withValues(alpha: 0.40),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.verified_rounded, color: AppColors.emerald, size: 11),
        const SizedBox(width: 4),
        Text('Vérifié', style: GoogleFonts.dmSans(
          fontSize: 10, fontWeight: FontWeight.w600,
          color: AppColors.emerald,
        )),
      ],
    ),
  ),
```

> 💡 **Astuce** : place le badge verified à gauche de la distance chip (top-left), pas à droite — ça hiérarchise la confiance avant la proximité.

---

### 3.2 Photo stack sur la ProfileCard (au lieu de l'emoji)

Heyama montre les vraies photos — c'est l'élément de conversion n°1.  
**Fichier cible :** `lib/features/discover/widgets/profile_card.dart`

Le widget `SignedPhotoImage` existe déjà dans `lib/core/widgets/signed_photo_image.dart`. Il suffit de l'injecter :

```dart
// Remplacer le Container emoji par :
profile.photoKeys.isNotEmpty
  ? PageView.builder(
      itemCount: profile.photoKeys.length,
      itemBuilder: (_, i) => SignedPhotoImage(
        photoKey: profile.photoKeys[i],
        fit: BoxFit.cover,
      ),
    )
  : _EmojiPlaceholder(emoji: profile.emoji),
```

Ajouter des **indicateurs de pages** (petits points blancs en haut de carte) pour signaler le nombre de photos — comme Heyama et Tinder. Ça augmente l'engagement sur chaque profil.

```dart
// Indicateurs photo — dans la Positioned top, sous la Row distance/badges
if (profile.photoKeys.length > 1)
  Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(profile.photoKeys.length, (i) =>
      AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 2),
        width: currentPage == i ? 16 : 5,
        height: 4,
        decoration: BoxDecoration(
          color: currentPage == i ? Colors.white : Colors.white38,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    ),
  ),
```

> 💡 **Astuce** : convertis `ProfileCard` en `StatefulWidget` et connecte un `PageController` pour tracker la page courante.

---

### 3.3 Onboarding "style annonce" (NDOLO-inspired)

Heyama demande de "poster une annonce" — ça cadre psychologiquement l'utilisateur dans une démarche intentionnelle plutôt que passive.

**Fichier cible :** `lib/features/auth/multi_step_register.dart`

Renomme les steps :
- Step 1 : **"Qui es-tu ?"** (nom, âge, photos)
- Step 2 : **"Ton identité"** (langue maternelle, origine/ville natale, intérêts culturels) ← inspiré NDOLO
- Step 3 : **"Ce que tu cherches"** (type de relation, deal-breakers)
- Step 4 : **Vérification photo** (déjà fait ✅)

Ajoute ces champs au modèle `Profile` (côté Prisma) :

```prisma
// server/prisma/schema.prisma
model Profile {
  // ...champs existants...
  nativeCity    String?
  languages     String[]   // ex: ["fr", "bamiléké", "en"]
  originCountry String?
  lookingFor    String?    // "casual" | "serious" | "friendship"
}
```

---

### 3.4 Grille "Admirateurs" (Who liked you)

C'est l'une des fonctionnalités les plus engageantes de Heyama — une grille des profils qui t'ont liké.

**Nouveau fichier :** `lib/features/discover/admirers_screen.dart`

```dart
class AdmirersScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Consumer<DiscoverProvider>(
        builder: (context, provider, _) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.75,
          ),
          itemCount: provider.admirers.length,
          itemBuilder: (context, i) => _AdmirerCard(
            profile: provider.admirers[i],
            // Flou si pas premium — incitation à upgrader
            blurred: !provider.isPremium && i >= 2,
          ),
        ),
      ),
    );
  }
}
```

Côté backend, ajoute un endpoint :
```typescript
// server/src/sync/sync.controller.ts
@Get('admirers')
@UseGuards(JwtGuard)
async getAdmirers(@Req() req) {
  return this.syncService.getAdmirers(req.userId);
}
// Requête Prisma : Like.findMany({ where: { toUserId: userId, status: 'pending' } })
```

> 💡 **Astuce monétisation** : affiche les 2 premiers admirateurs en clair, les suivants floutés avec un cadenas (exactement comme Bumble et Heyama). Ça convertit mieux qu'un paywall brutal.

---

## 4. Plan d'implémentation — Chat

### 4.1 Messages vocaux

C'est la fonctionnalité la plus différenciante de Heyama côté chat. Elle humanise les échanges.

**Packages à ajouter :**
```yaml
# pubspec.yaml
dependencies:
  record: ^5.1.2          # enregistrement micro
  just_audio: ^0.9.40     # lecture audio
  path_provider: ^2.1.0   # déjà présent probablement
```

**Modèle à étendre :**
```dart
// Dans matches_provider.dart — ChatMessage
class ChatMessage {
  final String id;
  final bool fromMe;
  final String? text;           // null si message vocal
  final String? audioLocalPath; // chemin local après enregistrement
  final String? audioRemoteUrl; // URL après upload
  final Duration? audioDuration;
  final MessageType type;       // text | voice
  final DateTime timestamp;
  // ...
}

enum MessageType { text, voice }
```

**Widget bouton vocal dans `_InputBar` :**

```dart
// Remplace le champ de texte statique par un toggle texte/vocal
GestureDetector(
  onLongPressStart: (_) => _startRecording(),
  onLongPressEnd: (_) => _stopAndSend(),
  child: AnimatedContainer(
    duration: const Duration(milliseconds: 200),
    width: _isRecording ? 120 : 46,
    height: 46,
    decoration: BoxDecoration(
      color: _isRecording ? AppColors.pink : AppColors.surfaceHigh,
      borderRadius: BorderRadius.circular(24),
    ),
    child: _isRecording
      ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _PulsingDot(),
          const SizedBox(width: 6),
          Text(_formatDuration(_elapsed),
            style: const TextStyle(color: Colors.white, fontSize: 13)),
        ])
      : const Icon(Icons.mic_none_rounded,
          color: AppColors.textSecondary, size: 20),
  ),
)
```

**Bubble vocale :**
```dart
class _VoiceBubble extends StatefulWidget {
  final ChatMessage msg;
  // ...
}
// Affiche: icône play ▶ | waveform simulée | durée
// Utilise just_audio pour la lecture
// La waveform peut être simulée avec des barres aléatoires de hauteur fixe
// (on ne stocke pas les amplitudes en v1)
```

> 💡 **Astuce** : pour la waveform, génère des hauteurs pseudo-aléatoires à partir du `hashCode` de l'`audioUrl` → déterministe, pas besoin de stocker les données audio réelles.

---

### 4.2 Icebreakers / suggestions de messages (coaching léger)

Heyama propose du coaching relationnel. Version allégée : des suggestions de premier message quand la conversation est vide.

**Dans `_MatchedHero` (chat_screen.dart), ajoute sous le texte "Break the ice" :**

```dart
const _icebreakers = [
  "C'est quoi ton endroit préféré dans le quartier ? 📍",
  "Si tu devais recommander un resto ici, ce serait lequel ?",
  "Qu'est-ce qui t'a amené(e) dans ce quartier ?",
];

Wrap(
  spacing: 8,
  runSpacing: 8,
  children: _icebreakers.map((q) => GestureDetector(
    onTap: () {
      widget.controller.text = q;
      widget.controller.selection = TextSelection.fromPosition(
        TextPosition(offset: q.length),
      );
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: AppColors.violet.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.violet.withValues(alpha: 0.25)),
      ),
      child: Text(q, style: GoogleFonts.dmSans(
        fontSize: 12.5, color: AppColors.violetGlow,
      )),
    ),
  )).toList(),
)
```

> 💡 **Astuce** : adapte les icebreakers selon le `hood` du match — si même quartier, "Ton endroit préféré dans *[quartier]*". Ça personnalise sans IA.

---

### 4.3 Indicateur "Lu" (read receipts)

Manquant dans NearMe actuellement, présent dans Heyama.

```dart
// Dans _MessageBubble, après l'heure :
if (msg.fromMe)
  Icon(
    msg.isRead
      ? Icons.done_all_rounded   // double check bleu
      : Icons.done_rounded,      // check simple gris
    size: 12,
    color: msg.isRead ? AppColors.cyan : AppColors.textMuted,
  ),
```

Côté WsService : envoie un event `message_read` via WebSocket quand `markAsRead` est appelé.

---

## 5. Plan d'implémentation — Matching & Algorithme

### 5.1 Matching culturel / de proximité étendue (inspiré NDOLO)

Heyama matche sur : origines, langue, plats locaux, culture.  
Pour NearMe hyperlocal, adapte en : **quartier commun + langue + centres d'intérêt**.

**Algorithme de score — backend :**
```typescript
// server/src/sync/sync.service.ts
function computeScore(user: Profile, candidate: Profile): number {
  let score = 0;
  
  // Proximité géographique (déjà géré par distanceKm)
  if (candidate.distanceKm < 1) score += 40;
  else if (candidate.distanceKm < 3) score += 25;
  else score += 10;
  
  // Langue commune
  const commonLangs = user.languages.filter(l => candidate.languages.includes(l));
  score += commonLangs.length * 15;
  
  // Origine commune
  if (user.originCountry && user.originCountry === candidate.originCountry) score += 20;
  
  // Intention compatible (lookingFor)
  if (user.lookingFor === candidate.lookingFor) score += 15;
  
  // Tags/intérêts communs
  const commonTags = user.tags.filter(t => candidate.tags.includes(t));
  score += Math.min(commonTags.length * 5, 15);
  
  return score;
}
```

> 💡 **Astuce** : expose ce score dans la réponse `/sync/pull` et affiche-le discrètement sur la ProfileCard (ex : "85% de points communs") — la transparence de l'algo booste la confiance.

---

### 5.2 Limite de swipes quotidiens + Super Like

Heyama utilise un système de coins. Pour NearMe, commence plus simple :

```dart
// Dans DiscoverProvider
static const int _dailySwipeLimit = 30; // gratuit
static const int _dailySuperLikeLimit = 3;

int _swipesToday = 0;
int _superLikesToday = 0;
DateTime _lastReset = DateTime.now();

bool get canSwipe {
  _maybeResetDaily();
  return _swipesToday < _dailySwipeLimit;
}

void _maybeResetDaily() {
  if (DateTime.now().difference(_lastReset).inDays >= 1) {
    _swipesToday = 0;
    _superLikesToday = 0;
    _lastReset = DateTime.now();
  }
}
```

Le Super Like (`gold`) est déjà dans le design (bouton étoile dans `app_colors.dart`). Il suffit de l'activer avec une animation `ScaleTransition` + envoi d'un like de type `super`.

---

## 6. Plan d'implémentation — Sécurité & Trust

### 6.1 Améliorer le flow de vérification photo

NearMe a `FaceCompareService` mais si l'utilisateur skip, `isFaceVerified = false` et rien ne se passe. Heyama rend la vérification obligatoire — **bloque l'accès à Discover**.

```dart
// Dans app.dart (_AuthGuard ou initialRoute logic) :
if (user != null && !user.isFaceVerified) {
  return '/identity-verification'; // redirection forcée
}
```

Ajoute un écran interstitiel expliquant pourquoi la vérif est demandée (trust, safety) avant de lancer la caméra.

---

### 6.2 Signalement in-chat

**Dans `chat_screen.dart`, dans l'AppBar `actions` (derrière le bouton `more_horiz`) :**

```dart
// BottomSheet sur tap du bouton "..."
showModalBottomSheet(context: context, builder: (_) => _ReportSheet(
  profileName: entry.profile.name,
  onReport: (reason) {
    context.read<MatchesProvider>().reportMatch(_matchId, reason);
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Signalement envoyé. Merci.'))
    );
  },
));

// Raisons : "Profil faux", "Comportement inapproprié", "Spam", "Autre"
```

---

## 7. Plan d'implémentation — Monétisation

Heyama apprend (à la dure via les avis) que le **modèle coins tout-payant frustre et fait churner**.

**Recommandation pour NearMe :**

| Feature | Gratuit | Premium |
|---------|---------|---------|
| Swipes / jour | 30 | Illimité |
| Super Likes / jour | 1 | 5 |
| Voir les admirateurs | 2 premiers | Tous |
| Messages vocaux | ✅ toujours gratuit | — |
| Boost (top des découvertes) | ❌ | ✅ |
| Icebreakers IA | 3 fixes | Personnalisés |

Le Stripe stub est déjà là (`lib/data/services/stripe_service.dart`). Pour l'activer :

```dart
// Remplacer dans StripeService :
Future<bool> purchasePremium() async {
  // TODO: stripe_sdk ou flutter_stripe
  // Pour l'instant, simuler :
  await Future.delayed(const Duration(seconds: 2));
  return true;
}
```

> 💡 **Astuce** : ne bloquez **jamais** les messages vocaux derrière un paywall (erreur de Heyama signalée dans les avis). C'est un vecteur d'engagement organique trop fort.

---

## 8. Priorités d'implémentation (roadmap suggérée)

| Priorité | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Vraies photos sur ProfileCard + indicateurs | 2j | Très haut |
| 🔴 P0 | Verified badge visible | 0.5j | Haut |
| 🟠 P1 | Grille admirateurs (backend + UI) | 3j | Haut |
| 🟠 P1 | Messages vocaux | 4j | Très haut |
| 🟠 P1 | Icebreakers dans chat vide | 1j | Moyen |
| 🟡 P2 | Read receipts | 1j | Moyen |
| 🟡 P2 | Score de compatibilité culturelle | 3j | Moyen |
| 🟡 P2 | Limite swipes + Super Like | 2j | Haut |
| 🟢 P3 | Signalement in-chat | 1j | Haut (confiance) |
| 🟢 P3 | Onboarding "style annonce" | 2j | Moyen |
| 🟢 P3 | Stripe / Premium | 5j | Haut (revenus) |

---

## 9. Ce que NearMe fait déjà mieux que Heyama

- **Offline-first** : Drift + SyncManager — aucun bug de "conversations disparues"
- **Design système cohérent** : palette violet/glassmorphic clairement définie vs Heyama hétérogène
- **Routing protégé** : `_AuthGuard` propre vs Heyama (crash sur sessions expirées reporté)
- **JWT Refresh** : rotation token implémentée — Heyama force des re-logins

→ **Capitalise sur ces avantages dans le marketing** : "Tes conversations ne disparaissent jamais" est une promesse directe en réponse au pain point n°1 de Heyama.

---

*Sources : App Store / Google Play Heyama, mwm.ai, avis utilisateurs — juin 2026*
