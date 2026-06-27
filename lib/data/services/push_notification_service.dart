import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// Service pour gérer les notifications push FCM
/// - Enregistre les tokens FCM
/// - Gère les messages entrants (foreground/background)
/// - Nettoyage des tokens lors de la déconnexion
class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final auth.FirebaseAuth _auth = auth.FirebaseAuth.instance;

  /// Initialise le service de notification pour l'utilisateur actuel
  Future<void> init() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      debugPrint('PushNotificationService.init: No authenticated user');
      return;
    }

    try {
      // Demander la permission (iOS/web)
      final settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (kDebugMode) {
        debugPrint(
          'Notification permission: ${settings.authorizationStatus.name}',
        );
      }

      // Récupérer et sauvegarder le token initial
      final token = await _messaging.getToken();
      if (token != null) {
        await _saveTokenToFirestore(token, currentUser.uid);
      }

      // Écouter les changements de token
      _messaging.onTokenRefresh.listen((newToken) {
        final uid = _auth.currentUser?.uid;
        if (uid != null) {
          _saveTokenToFirestore(newToken, uid);
        }
      });

      // Configurer les handlers
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

      if (kDebugMode) {
        debugPrint('✓ PushNotificationService initialized for user: ${currentUser.uid}');
      }
    } catch (e) {
      debugPrint('Error initializing PushNotificationService: $e');
    }
  }

  /// Sauvegarde le token FCM dans Firestore profiles/{uid}/fcmTokens
  Future<void> _saveTokenToFirestore(String token, String userId) async {
    try {
      await _db
          .collection('profiles')
          .doc(userId)
          .update({
            'fcmTokens.$token': true,
          })
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () =>
                throw Exception('Timeout saving FCM token'),
          );

      if (kDebugMode) {
        debugPrint('✓ FCM token saved for user: $userId');
      }
    } on FirebaseException catch (e) {
      // Si le document n'existe pas, le créer
      if (e.code == 'not-found') {
        try {
          await _db
              .collection('profiles')
              .doc(userId)
              .set({
                'fcmTokens': {token: true},
              }, SetOptions(merge: true));

          if (kDebugMode) {
            debugPrint('✓ Profile created with FCM token for user: $userId');
          }
        } catch (createErr) {
          debugPrint('Error creating profile with FCM token: $createErr');
        }
      } else {
        debugPrint('Error saving FCM token: $e');
      }
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  /// Supprime le token FCM lors de la déconnexion
  Future<void> removeToken() async {
    try {
      final token = await _messaging.getToken();
      final userId = _auth.currentUser?.uid;

      if (token == null || userId == null) {
        return;
      }

      await _db
          .collection('profiles')
          .doc(userId)
          .update({
            'fcmTokens.$token': FieldValue.delete(),
          })
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () =>
                throw Exception('Timeout removing FCM token'),
          );

      if (kDebugMode) {
        debugPrint('✓ FCM token removed for user: $userId');
      }
    } catch (e) {
      debugPrint('Error removing FCM token: $e');
    }
  }

  /// Gère les messages reçus quand l'app est au foreground
  /// Affiche une notification locale
  void _handleForegroundMessage(RemoteMessage message) {
    if (kDebugMode) {
      debugPrint(
        'Foreground message: ${message.notification?.title} - ${message.notification?.body}',
      );
      debugPrint('Data: ${message.data}');
    }
    // TODO: Afficher une notification locale si nécessaire
    // avec flutter_local_notifications
  }

  /// Gère les messages quand l'app est ouverte depuis une notification
  /// Navigation vers la conversation appropriée
  void _handleMessageOpenedApp(RemoteMessage message) {
    if (kDebugMode) {
      debugPrint(
        'App opened from notification: ${message.notification?.title}',
      );
      debugPrint('Data: ${message.data}');
    }

    // Récupérer les données de la notification
    final conversationId = message.data['conversationId'];
    final senderId = message.data['senderId'];

    if (conversationId != null && senderId != null) {
      // TODO: Naviguer vers la conversation
      // Cela devrait être fait via un stream/listener dans le app.dart
      debugPrint('Should navigate to conversation: $conversationId');
    }
  }

  /// Static method pour DELETE tous les tokens d'un utilisateur (cleanup)
  static Future<void> deleteAllTokensForUser(String userId) async {
    try {
      final db = FirebaseFirestore.instance;
      await db
          .collection('profiles')
          .doc(userId)
          .update({
            'fcmTokens': {},
          })
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () =>
                throw Exception('Timeout deleting FCM tokens'),
          );

      debugPrint('✓ All FCM tokens deleted for user: $userId');
    } catch (e) {
      debugPrint('Error deleting FCM tokens: $e');
    }
  }
}
