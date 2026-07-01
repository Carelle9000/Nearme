# Prompt d'implémentation — Mode Clair / Sombre pour NearMe

Prompt prêt à copier-coller dans Claude Code (ou tout agent de codage) pour implémenter proprement le light/dark mode sur l'app NearMe (Expo Router + React Native 0.85 + Firebase).

---

## Contexte du projet (à inclure dans le prompt)

NearMe est une app de rencontre construite avec :
- Expo SDK 56 + Expo Router (typed routes)
- React Native 0.85 / React 19
- Firebase (auth, Firestore, functions)
- Un système de thème "maison" déjà commencé mais **cassé et incomplet** :
  - `src/constants/theme.ts` exporte un objet `Colors` **plat** (une seule palette rouge/sombre), pas de variantes `light`/`dark`.
  - `ThemeColor` est importé depuis `theme.ts` dans `themed-view.tsx` et `themed-text.tsx` mais **n'existe pas** dans le fichier — ça casse le typage.
  - `useTheme()` fait `Colors[scheme]` en supposant que `Colors` a des clés `light`/`dark`, ce qui renvoie `undefined` en pratique (bug silencieux).
  - `app.json` force `"userInterfaceStyle": "dark"` — l'app ignore le thème système.
  - Seuls 6 fichiers utilisent `ThemedView`/`ThemedText`. Environ **29 fichiers sur 86** contiennent des couleurs hexadécimales codées en dur (hors composants themed), donc la majorité de l'UI ne passera pas automatiquement en clair.
  - Aucun `ThemeContext`, aucune persistance de préférence utilisateur (ni AsyncStorage ni ailleurs).

L'objectif : un vrai système de thème clair/sombre, avec bascule manuelle (Système / Clair / Sombre) dans les réglages, persistée, sans flash visuel au démarrage, en conservant l'identité visuelle rouge/rose de la marque.

---

## Le prompt à utiliser

```
Tu es un développeur frontend React Native/Expo expérimenté. Implémente un système
de thème clair/sombre complet et robuste sur l'app NearMe (Expo Router, RN 0.85,
Firebase). Voici l'état actuel du code et ce qu'il faut livrer.

### État actuel (bugs à corriger, pas juste à contourner)
- `src/constants/theme.ts` exporte `Colors` comme un objet PLAT (une seule palette
  rouge/sombre : background #1E1117, primary #E83D51, etc.) au lieu d'un objet
  `{ light: {...}, dark: {...} }`.
- `ThemeColor` est importé dans `src/components/themed-view.tsx` et
  `src/components/themed-text.tsx` depuis `theme.ts` mais n'y est jamais défini/exporté.
- `src/hooks/use-theme.ts` fait `Colors[scheme]` (scheme = 'light' | 'dark'), ce qui
  ne fonctionne pas tant que `Colors` reste plat.
- `app.json` a `"userInterfaceStyle": "dark"` — à changer pour respecter le choix
  utilisateur.
- La majorité des écrans (~29 fichiers) utilisent des couleurs hexadécimales en dur
  (`#1E1117`, `#E83D51`, etc.) directement dans des `StyleSheet.create`, en dehors de
  `ThemedView`/`ThemedText`.

### Ce qu'il faut livrer

1. **Palette double (light/dark)**
   Restructure `src/constants/theme.ts` en :
   - `export type ThemeColor = keyof typeof Colors.light` (ou équivalent strict)
   - `export const Colors = { light: {...}, dark: {...} }` avec les MÊMES clés dans
     les deux (background, cardSurface, primary, accent, secondary, text,
     textSecondary, border, success, warning, + toute clé utilisée ailleurs dans le
     code).
   - Conserve la teinte rouge/rose de la marque (#E83D51 / #F5A5B5) comme `primary`/
     `accent` dans les DEUX thèmes ; adapte seulement les tons neutres (fonds, cartes,
     textes, bordures) pour un mode clair lisible avec un bon contraste (WCAG AA
     minimum, ratio ≥ 4.5:1 pour le texte standard).
   - Ajoute aussi des variantes `light`/`dark` pour `Gradients` et pour les couleurs
     d'ombre dans `Shadows` (les ombres noires à 35% d'opacité sont invisibles sur
     fond clair : prévoir une variante plus subtile).
   - Ne touche pas à `Fonts`, `Spacing`, `BorderRadius`, `BottomTabInset`,
     `MaxContentWidth`.

2. **ThemeContext + persistance**
   Crée `src/context/theme-context.tsx` :
   - État : `themePreference: 'system' | 'light' | 'dark'` et `resolvedTheme: 'light' | 'dark'`
     (calculé à partir de la préférence + `useColorScheme()` natif si `'system'`).
   - Persistance via `@react-native-async-storage/async-storage` (déjà une
     dépendance) sous une clé type `@nearme/theme-preference`.
   - Au montage : lire la préférence stockée AVANT de démonter le splash screen
     (utiliser `expo-splash-screen`, déjà présent) pour éviter un flash de mauvais
     thème (FOUC).
   - Expose un hook `useThemePreference()` qui retourne
     `{ themePreference, resolvedTheme, colors, setThemePreference }`.
   - `colors` = `Colors[resolvedTheme]`, prêt à consommer partout.
   - Enveloppe l'app avec ce provider dans `src/app/_layout.tsx`, au-dessus des
     autres providers (`auth-context`, etc.), mais sous le `GestureHandlerRootView`
     si présent.

3. **Corriger les hooks/composants existants**
   - `src/hooks/use-theme.ts` : remplace l'implémentation par un simple ré-export
     de `useThemePreference().colors` (garder le nom `useTheme` pour ne pas casser
     les imports existants), ou fusionne carrément les deux hooks — à toi de choisir
     la solution la plus propre, mais sans dupliquer la logique de résolution du thème.
   - `src/hooks/use-color-scheme.ts` et `use-color-scheme.web.ts` : gardent leur rôle
     (lire le thème SYSTÈME), ne changent pas de contrat — c'est `theme-context.tsx`
     qui décide s'il faut suivre le système ou une préférence forcée.
   - `src/components/themed-view.tsx` et `themed-text.tsx` : mets à jour les imports
     de types pour utiliser le nouveau `ThemeColor` exporté par `theme.ts`, vérifie
     que `theme[type ?? 'background']` compile et fonctionne dans les deux modes.

4. **Migrer les couleurs codées en dur**
   Audite tous les fichiers `.tsx`/`.ts` sous `src/` contenant des couleurs
   hexadécimales ou `rgba(...)` en dur dans des styles (`grep -rlE "#[0-9A-Fa-f]{3,8}"`
   pour les repérer). Pour chaque fichier :
   - Si la couleur correspond à une clé de `Colors` (background, primary, texte,
     bordure, etc.) → remplace par `useTheme()`/`useThemePreference().colors` et
     référence la clé correspondante.
   - Si c'est une couleur ponctuelle qui n'a pas de sens dans les deux thèmes
     (ex. un badge toujours vert), garde-la en dur mais vérifie qu'elle reste
     lisible/contrastée sur fond clair ET sombre.
   - Attention aux `StyleSheet.create` statiques : les couleurs qui dépendent du
     thème ne peuvent plus être définies dans un objet `StyleSheet.create` figé au
     chargement du module — il faut soit calculer les styles dynamiquement dans le
     composant (via une fonction `createStyles(colors)` appelée avec les couleurs du
     thème courant), soit passer les couleurs via des props de style inline. Choisis
     un pattern cohérent et applique-le partout (privilégie `createStyles(colors)`
     pour garder les perfs de `StyleSheet.create` autant que possible en mémoïsant
     avec `useMemo`).
   - Fais spécifiquement attention à : `src/app/explore.tsx`,
     `src/components/app-tabs.tsx` / `app-tabs.web.tsx`, `src/components/hint-row.tsx`,
     `src/components/ui/collapsible.tsx`, `src/components/web-badge.tsx`, et tous les
     écrans sous `src/app/(tabs)`, `src/app/auth`, `src/app/chat`, `src/app/matches`,
     `src/app/profile`, `src/app/legal`.

5. **Éléments système à synchroniser avec le thème**
   - `expo-status-bar` : la barre de statut doit passer en `style="dark"` (icônes
     sombres) en mode clair et `style="light"` en mode sombre — piloter ça
     dynamiquement depuis `resolvedTheme`, pas une valeur figée.
   - `expo-system-ui` : mettre à jour `SystemUI.setBackgroundColorAsync(...)` (fond
     de la fenêtre Android sous la nav bar) quand le thème change.
   - `app.json` : passer `"userInterfaceStyle"` de `"dark"` à `"automatic"` pour que
     l'OS ne force plus rien et laisse l'app gérer elle-même (via le provider) ; garder
     `splash.backgroundColor` cohérent ou prévoir une version day/night du splash si
     Expo le permet dans cette version de SDK.
   - Icônes (`@expo/vector-icons`) et illustrations : vérifier qu'aucune icône/image
     n'est un PNG à fond blanc/transparent qui deviendrait invisible sur fond clair
     ou sombre ; utiliser `tintColor`/`color` piloté par le thème partout où c'est
     supporté.
   - Claviers natifs (champs de saisie) : `keyboardAppearance` doit suivre
     `resolvedTheme` sur les inputs concernés (auth, chat, profil).

6. **UI de réglage utilisateur**
   Ajoute un composant de sélection de thème (3 options : Système / Clair / Sombre,
   type segmented control ou radio list) dans l'écran de réglages / profil existant
   (cherche l'écran de settings sous `src/app/profile` ou équivalent). Appelle
   `setThemePreference()` du contexte. Persiste immédiatement en AsyncStorage.

7. **Web (`react-native-web`)**
   Le projet compile aussi pour le web (`expo start --web`, `use-color-scheme.web.ts`
   existe déjà). Vérifie que le changement de thème fonctionne aussi correctement en
   version web, y compris la lecture initiale de `prefers-color-scheme` et l'absence
   de flash au premier rendu (le hook web a déjà un système de `hasHydrated`, à
   réutiliser/adapter si besoin sans casser le rendu statique SSR d'Expo Router).

8. **Tests / validation à effectuer avant de considérer la tâche terminée**
   - `npx tsc --noEmit` doit passer sans erreur (en particulier plus d'erreur sur
     `ThemeColor`).
   - `npm run lint` doit passer.
   - Vérifier manuellement (simulateur iOS/Android + web) : bascule Système → Clair
     → Sombre → Système, sur au moins les écrans suivants : onboarding/auth, tabs
     principaux (discover/matches/chat/profil), un écran de chat avec bulles de
     message, l'écran de réglages lui-même.
   - Vérifier qu'il n'y a pas de flash blanc/noir au lancement de l'app dans les deux
     thèmes.
   - Vérifier le contraste texte/fond en mode clair (pas de texte blanc sur fond clair
     oublié, pas de bordures invisibles).
   - Documenter dans `PROJECT_ARCHITECTURE.md` la nouvelle architecture de thème (où
     est `ThemeContext`, comment ajouter une couleur, comment un composant doit
     consommer le thème) pour que les prochains écrans suivent la convention.

### Contraintes
- Ne pas introduire de nouvelle dépendance (styled-components, nativewind, etc.) :
  rester sur `StyleSheet` + contexte React, cohérent avec l'existant.
- Ne pas casser les imports publics actuels (`ThemedView`, `ThemedText`, `useTheme`)
  utilisés ailleurs — adapter leur implémentation interne, pas leur API si évitable.
- Committer par étapes logiques (palette → contexte → migration composants → réglages
  UI → polish système) pour faciliter la revue.
```

---

## Notes pour toi (pas à inclure dans le prompt)

Quelques points à surveiller pendant la revue du travail livré par l'agent :
- Que `Colors.light` et `Colors.dark` aient exactement les mêmes clés (sinon TS
  n'attrapera pas les erreurs si l'un des deux objets a une clé en moins).
- Que le remplacement des `StyleSheet.create` statiques par des styles dynamiques ne
  dégrade pas les perfs (pas de recréation d'objet de style à chaque render sans
  `useMemo`).
- Que la palette claire choisie garde un bon contraste avec le rouge `#E83D51`
  (parfois un rouge vif passe mal sur fond blanc pur — envisager un fond légèrement
  cassé, ex. `#FFF8F8`, plutôt que `#FFFFFF` pur).
- Tester particulièrement les écrans de chat et de swipe (souvent pleins de couleurs
  en dur pour les cartes/bulles).
