import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// Service pour gérer les notifications push FCM
/// Enregistre le token FCM de l'utilisateur et gère les notifications entrantes
class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Initialise le service de notification
  Future<void> init() async {
    // Demander la permission de notification (iOS)
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
      debugPrint('Notification permission: ${settings.authorizationStatus}');
    }

    // Récupérer le token FCM
    final token = await _messaging.getToken();
    if (token != null) {
      await _saveToken(token);
    }

    // Écouter les changements de token
    _messaging.onTokenRefresh.listen((token) {
      _saveToken(token);
    });

    // Configurer les handlers pour les notifications en foreground et background
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
  }

  /// Sauvegarde le token FCM dans Firestore
  Future<void> _saveToken(String token) async {
    try {
      final userId = _getUserId();
      if (userId == null) return;

      await _db.collection('profiles').doc(userId).update({
       ('fcmTokens.$token'): true,
      });
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  /// Supprime le token FCM lors de la déconnexion
  Future<void> removeToken() async {
    try {
      final token = await _messaging.getToken();
      if (token == null) return;

      final userId = _getUserId();
      if (userId == null) return;

      await _db.collection('profiles').doc(userId).update({
        'fcmTokens.$token': FieldValue.delete(),
      });
    } catch (e) {
      debugPrint('Error removing FCM token: $e');
    }
  }

  /// Gère les messages reçus quand l'app est en foreground
  void _handleForegroundMessage(RemoteMessage message) {
    if (kDebugMode) {
      debugPrint('Received message in foreground: ${message.notification?.title}');
    }
    // Vous pouvez afficher une notification locale ici si nécessaire
  }

  /// Gère les messages reçus quand l'app est en background et ouverte
  void _handleBackgroundMessage(RemoteMessage message) {
    if (kDebugMode) {
      debugPrint('Received message in background: ${message.notification?.title}');
    }
    // Naviguer vers la conversation appropriée
  }

  /// Récupère l'ID de l'utilisateur actuel
  String? _getUserId() {
    // Cette méthode devrait être adaptée selon votre système d'auth
    // Pour l'instant, retourne null car nous n'avons pas accès à AuthProvider ici
    return null;
  }

  /// Envoie une notification push via Cloud Functions
  /// Note: Cela nécessite une Cloud Function côté serveur
  static Future<void> sendPushNotification({
    required String recipientId,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    // Cette fonction devrait appeler une Cloud Function
    // qui utilisera admin.messaging().send() du SDK Firebase Admin
    // Exemple de structure de la Cloud Function:
    /*
    exports.sendPushNotification = functions.https.onCall(async (data, context) => {
      const { recipientId, title, body, notificationData } = data;
      
      // Récupérer les tokens FCM du destinataire
      const userDoc = await admin.firestore().collection('profiles').doc(recipientId).get();
      const fcmTokens = userDoc.data()?.fcmTokens || {};
      
      const tokens = Object.keys(fcmTokens);
      if (tokens.length === 0) return;
      
      const message = {
        notification: { title, body },
        data: notificationData || {},
        tokens: tokens,
      };
      
      await admin.messaging().sendMulticast(message);
    });
    */
    
    debugPrint('Push notification would be sent to $recipientId: $title - $body');
  }
}
