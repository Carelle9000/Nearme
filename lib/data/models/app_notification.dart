import 'package:cloud_firestore/cloud_firestore.dart';

enum NotificationType { like, match, message, visit }

class AppNotification {
  final String id;
  final String senderId;
  final String senderName;
  final String? senderPhoto;
  final NotificationType type;
  final String message;
  final DateTime createdAt;
  final bool isRead;

  AppNotification({
    required this.id,
    required this.senderId,
    required this.senderName,
    this.senderPhoto,
    required this.type,
    required this.message,
    required this.createdAt,
    this.isRead = false,
  });

  factory AppNotification.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AppNotification(
      id: doc.id,
      senderId: data['senderId'] ?? '',
      senderName: data['senderName'] ?? '',
      senderPhoto: data['senderPhoto'],
      type: NotificationType.values.firstWhere(
        (e) => e.name == data['type'],
        orElse: () => NotificationType.visit,
      ),
      message: data['message'] ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isRead: data['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderId': senderId,
      'senderName': senderName,
      'senderPhoto': senderPhoto,
      'type': type.name,
      'message': message,
      'createdAt': FieldValue.serverTimestamp(),
      'isRead': isRead,
    };
  }
}
