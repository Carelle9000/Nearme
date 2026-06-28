import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import '../models/profile.dart';
import 'notification_service.dart';
import '../models/app_notification.dart';

class MatchService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final NotificationService _notificationService = NotificationService();

  /// Enregistre un "Like" et vérifie si c'est un match mutuel
  Future<bool> swipeLike(String currentUserId, String currentUserName, String? currentUserPhoto, Profile targetProfile) async {
    try {
      // ✅ Sécurité : Utiliser l'UID réel de Firebase Auth
      final authenticatedUid = auth.FirebaseAuth.instance.currentUser?.uid;
      if (authenticatedUid == null) throw Exception('User not authenticated');

      final uid = authenticatedUid;
      print('DEBUG: swipeLike - uid=$uid, targetId=${targetProfile.id}');

      // 1. Enregistrer le like envoyé
      print('DEBUG: Writing to sent_likes');
      await _db
          .collection('profiles')
          .doc(uid)
          .collection('sent_likes')
          .doc(targetProfile.id)
          .set({
        'targetId': targetProfile.id,
        'createdAt': FieldValue.serverTimestamp(),
      });
      print('DEBUG: sent_likes written successfully');

      // 2. Enregistrer le like reçu chez la cible
      print('DEBUG: Writing to received_likes');
      await _db
          .collection('profiles')
          .doc(targetProfile.id)
          .collection('received_likes')
          .doc(uid)
          .set({
        'senderId': uid,
        'createdAt': FieldValue.serverTimestamp(),
      });
      print('DEBUG: received_likes written successfully');

      // 3. Vérifier si l'autre m'a déjà liké (match)
      final otherLike = await _db
          .collection('profiles')
          .doc(uid)
          .collection('received_likes')
          .doc(targetProfile.id)
          .get();

      if (otherLike.exists) {
        // C'est un match !
        await _createMatch(uid, targetProfile.id);
        // ... reste du code identique ...

        // Notification de match pour la cible
        await _notificationService.sendNotification(
          recipientId: targetProfile.id,
          senderId: currentUserId,
          senderName: currentUserName,
          senderPhoto: currentUserPhoto,
          type: NotificationType.match,
          message: 'It\'s a match with $currentUserName!',
        );

        // Notification de match pour l'utilisateur actuel
        await _notificationService.sendNotification(
          recipientId: currentUserId,
          senderId: targetProfile.id,
          senderName: targetProfile.name,
          senderPhoto: targetProfile.photos.isNotEmpty ? targetProfile.photos.first : null,
          type: NotificationType.match,
          message: 'It\'s a match with ${targetProfile.name}!',
        );

        return true;
      } else {
        // Simple Like : Notification "Quelqu'un vous a liké"
        await _notificationService.sendNotification(
          recipientId: targetProfile.id,
          senderId: currentUserId,
          senderName: currentUserName,
          senderPhoto: currentUserPhoto,
          type: NotificationType.like,
          message: '$currentUserName sent you a Like!',
        );
      }
      return false;
    } catch (e) {
      print('Error swiping like: $e');
      return false;
    }
  }

  /// Enregistre un "Nope" (rejet)
  Future<void> swipeNope(String currentUserId, String targetUserId) async {
    try {
      await _db
          .collection('profiles')
          .doc(currentUserId)
          .collection('nopes')
          .doc(targetUserId)
          .set({
        'targetId': targetUserId,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error swiping nope: $e');
    }
  }

  Future<void> _createMatch(String user1, String user2) async {
    final matchId = user1.compareTo(user2) <= 0
        ? '${user1}_$user2'
        : '${user2}_$user1';

    await _db.collection('matches').doc(matchId).set({
      'users': [user1, user2],
      'matchedAt': FieldValue.serverTimestamp(),
      'lastMessage': null,
    }, SetOptions(merge: true));
  }

  Stream<List<String>> getMatchesIds(String userId) {
    return _db
        .collection('matches')
        .where('users', arrayContains: userId)
        .snapshots()
        .map((snap) => snap.docs.map((doc) {
              final users = List<String>.from(doc.data()['users']);
              return users.firstWhere((id) => id != userId);
            }).toList());
  }
}
