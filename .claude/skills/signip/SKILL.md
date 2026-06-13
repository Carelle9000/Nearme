---
description: Sign up prod
---
## Instructions
1- Google : intégrer le package google_sign_in, obtenir un idToken, et l'envoyer au backend pour vérification + création de compte.
2- Apple : intégrer sign_in_with_apple, même logique côté backend.
3- Le backend devrait avoir un endpoint POST /auth/google et POST /auth/apple qui valident les tokens OAuth et renvoient un JWT NearMe.
4- Documente bien ton travail
5- Ne lance pas node server.js si des erreurs critiques sont détectées
6- Utilise les bonnes pratiques de sécurité pour l'authentification
7- Utilise les bonnes pratiques de sécurité pour le stockage des mots de passe
8- Utilise les bonnes pratiques de sécurité pour le stockage des tokens