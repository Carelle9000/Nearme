import 'package:flutter/foundation.dart' show kIsWeb;

/// Configuration centrale — URLs et seuils.
/// Toutes les clés API sensibles vivent côté serveur (variables d'env).
abstract final class AppConfig {
  AppConfig._();

  // Flutter Web (Chrome) → localhost
  // Émulateur Android   → 10.0.2.2
  static String get serverUrl =>
      kIsWeb ? 'http://localhost:8080' : 'http://10.0.2.2:8080';

  // WebSocket : même hôte, protocole ws/wss
  static String get wsUrl =>
      serverUrl.replaceFirst('http', 'ws').replaceFirst('https', 'wss');

  // ── Face comparison (proxy sur le serveur) ───────────────────────────────
  static String get compareFacesUrl => '$serverUrl/faces/compare';

  // ── Photos ───────────────────────────────────────────────────────────────
  static String photoUrl(String path) =>
      path.startsWith('http') ? path : '$serverUrl$path';

  // ── Seuil de correspondance faciale ─────────────────────────────────────
  static const double faceMatchThreshold = 75.0;

  // ── Google Sign-In ───────────────────────────────────────────────────────
  // Rempli uniquement pour Flutter Web. Sur Android/iOS le clientId est lu
  // depuis google-services.json / GoogleService-Info.plist.
  // Obtenir ce clientId dans Google Cloud Console → Identifiants → Client OAuth Web.
  static const String googleWebClientId =
      "513859324827-q9kec51te7cifs6t3bmvratg69h3et21.apps.googleusercontent.com";
}
