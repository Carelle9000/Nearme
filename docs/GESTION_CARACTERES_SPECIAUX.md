# Gestion des Caractères Spéciaux - Guide Complet

## Problème

Dans toute l'application, nous avons rencontré des problèmes d'encodage avec les caractères spéciaux (é, è, ç, ñ, etc.). Ces caractères peuvent être mal affichés ou corrompus lors de la transmission de données.

## Solutions Implémentées

### 1. **Centralisation des Traductions**

Toutes les chaînes de caractères avec accents doivent être dans le fichier centralisé:
```typescript
// ✅ BON - Utiliser les traductions centralisées
src/constants/locales.ts → TRANSLATIONS
src/context/localization-context.tsx → useLocalization()
```

```typescript
// ❌ MAUVAIS - Éviter les strings codées en dur
const error = 'Erreur de connexion'; // ❌ À éviter
```

### 2. **Utiliser les Fonctions de Normalisation**

Pour toute manipulation de chaînes avec caractères spéciaux:

```typescript
import { sanitizeForTransmission, normalizeString } from '@/utils/string-normalization';

// Avant transmission à l'API
const cleanedName = sanitizeForTransmission(userInput);

// Pour stockage en base de données
const normalized = normalizeString(userName, 'NFC');
```

### 3. **Gérer les Erreurs Correctement**

```typescript
import { useFirebaseError } from '@/hooks/useFirebaseError';
import { useLocalization } from '@/context/localization-context';

function LoginComponent() {
  const { parseError } = useFirebaseError();
  const { t } = useLocalization();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
    } catch (error) {
      const { userFriendly } = parseError(error);
      // userFriendly est automatiquement traduit et encodé
      showToast(userFriendly);
    }
  };
}
```

### 4. **Checklist pour les Nouveaux Textes**

Avant d'ajouter un nouveau texte avec caractères spéciaux:

- [ ] Le texte est-il en français? Ajouter à `TRANSLATIONS.fr` dans `locales.ts`
- [ ] Utiliser `const { t } = useLocalization()` pour accéder au texte
- [ ] Ne pas coder la chaîne en dur dans le composant
- [ ] Utiliser `sanitizeForTransmission()` avant d'envoyer à une API
- [ ] Tester avec des caractères spéciaux: é, è, ê, à, ù, ç, ñ, etc.

### 5. **Encodage UTF-8 des Fichiers**

Tous les fichiers TypeScript/JavaScript doivent avoir:
- **Encodage**: UTF-8 avec BOM (recommandé pour Windows)
- **Line endings**: LF (Unix) ou CRLF (Windows) - pas mélangés

**Configuration VSCode:**
```json
{
  "files.encoding": "utf8",
  "files.eol": "\n"
}
```

### 6. **Caractères Spéciaux Courants**

| Caractère | HTML Entity | Unicode | Utilisation |
|-----------|-------------|---------|-------------|
| é | `&é;` | `é` | Français |
| è | `&è;` | `è` | Français |
| ê | `&ê;` | `ê` | Français |
| à | `&à;` | `à` | Français |
| ù | `&ù;` | `ù` | Français |
| ç | `&ccedil;` | `ç` | Français |
| ñ | `&ntilde;` | `ñ` | Espagnol |
| ' | `&apos;` ou `&#39;` | `'` | Apostrophe |

### 7. **Transmission API & Base de Données**

```typescript
// Service API
async function saveUserProfile(userData: Profile) {
  // Nettoyer avant transmission
  const cleanData = {
    ...userData,
    bio: sanitizeForTransmission(userData.bio),
    firstName: sanitizeForTransmission(userData.firstName),
  };

  return api.post('/profile', cleanData);
}

// Réception de l'API
function displayUserProfile(data: any) {
  const { t } = useLocalization();
  // Les données de l'API sont automatiquement normalisées
  // par localizeAndNormalizeData()
}
```

### 8. **Tester les Caractères Spéciaux**

Créer des tests avec des données incluant:
```typescript
const testCases = [
  { name: 'François', bio: 'J\'aime programmer' },
  { name: 'José', bio: 'Passionné par l\'IA' },
  { name: '李明', bio: '中文测试' },
  { name: 'Müller', bio: 'Intéressé par la technologie' },
];
```

### 9. **Erreurs Courantes à Éviter**

```typescript
// ❌ MAUVAIS - Double encoding
const error = "L\'erreur s\'est produite"; // Apostrophe échappée inutilement

// ✅ BON - Format simple
const error = "L'erreur s'est produite"; // Caractères directs

// ❌ MAUVAIS - Mélange de sources
const messages = [
  t('errorMessage'),  // De la traduction
  'Erreur personnalisée' // Codée en dur ❌
];

// ✅ BON - Tout centralisé
const messages = [
  t('errorMessage'),
  t('customError')
];
```

### 10. **Debugging des Problèmes d'Encodage**

```typescript
// Vérifier l'encodage d'une chaîne
import { isValidUtf8 } from '@/utils/string-normalization';

console.log(isValidUtf8(userInput)); // true/false

// Voir les codes Unicode
const text = "François";
console.log([...text].map(c => c.charCodeAt(0)));
// [70, 114, 97, 110, 231, 111, 105, 115]

// Normaliser pour debug
const normalized = normalizeString(text, 'NFC');
```

## Résumé des Règles

1. **Toujours centraliser** les textes dans `TRANSLATIONS`
2. **Toujours nettoyer** avant transmission API avec `sanitizeForTransmission()`
3. **Toujours normaliser** avec `normalizeString()` pour la comparaison
4. **Jamais coder en dur** les chaînes avec accents
5. **Toujours utiliser** `useLocalization()` pour accéder aux textes
6. **Toujours encoder** les fichiers en UTF-8

## Ressources

- [Unicode Normalization](https://unicode.org/reports/tr15/)
- [JavaScript String Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [React i18n Best Practices](https://react.i18next.com/)
