import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/app_notification.dart';

class NotificationService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<AppNotification>> getNotifications(String userId) {
    return _db
        .collection('profiles')
        .doc(userId)
        .collection('notifications')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AppNotification.fromFirestore(doc))
            .toList());
  }

  Future<void> sendNotification({
    required String recipientId,
    required String senderId,
    required String senderName,
    String? senderPhoto,
    required NotificationType type,
    required String message,
  }) async {
    await _db
        .collection('profiles')
        .doc(recipientId)
        .collection('notifications')
        .add({
      'senderId': senderId,
      'senderName': senderName,
      'senderPhoto': senderPhoto,
      'type': type.name,
      'message': message,
      'createdAt': FieldValue.serverTimestamp(),
      'isRead': false,
    });
  }

  Future<void> markAsRead(String userId, String notificationId) async {
    await _db
        .collection('profiles')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .update({'isRead': true});
  }

  Future<void> markAllAsRead(String userId) async {
    final batch = _db.batch();
    final snapshot = await _db
        .collection('profiles')
        .doc(userId)
        .collection('notifications')
        .where('isRead', isEqualTo: false)
        .get();

    for (var doc in snapshot.docs) {
      batch.update(doc.reference, {'isRead': true});
    }

    await batch.commit();
  }

  Future<int> getUnreadCount(String userId) async {
    final snapshot = await _db
        .collection('profiles')
        .doc(userId)
        .collection('notifications')
        .where('isRead', isEqualTo: false)
        .get();
    return snapshot.size;
  }
}
