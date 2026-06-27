import 'package:cloud_firestore/cloud_firestore.dart';

enum MessageType { text, image, voice }

enum MessageStatus {
  sending,  // Locally created, not yet sent to Firestore
  sent,     // In Firestore, not yet delivered to client
  delivered, // Received by recipient's app
  read,      // Recipient has read the message
  failed,    // Failed to send
}

/// Message de conversation avec delivery tracking
class ChatMessage {
  final String id;
  final String senderId;
  final String content;
  final MessageType type;
  final DateTime createdAt;
  final DateTime? deliveredAt;
  final DateTime? readAt;
  final MessageStatus status;
  final String? errorMessage;

  // Media fields
  final String? imageUrl;
  final String? audioUrl;
  final int? duration;
  final int? fileSize;
  final int? imageWidth;
  final int? imageHeight;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.content,
    required this.type,
    required this.createdAt,
    this.deliveredAt,
    this.readAt,
    this.status = MessageStatus.sent,
    this.errorMessage,
    this.imageUrl,
    this.audioUrl,
    this.duration,
    this.fileSize,
    this.imageWidth,
    this.imageHeight,
  });

  /// Parse from Firestore document
  factory ChatMessage.fromFirestore(Map<String, dynamic> data, String messageId) {
    final createdAt = data['createdAt'];
    final deliveredAt = data['deliveredAt'];
    final readAt = data['readAt'];

    return ChatMessage(
      id: messageId,
      senderId: data['senderId'] as String,
      content: data['content'] as String? ?? '',
      type: _parseMessageType(data['type'] as String?),
      createdAt: createdAt is Timestamp ? createdAt.toDate() : DateTime.now(),
      deliveredAt: deliveredAt is Timestamp ? deliveredAt.toDate() : null,
      readAt: readAt is Timestamp ? readAt.toDate() : null,
      status: _parseStatus(data['status'] as String?),
      errorMessage: data['errorMessage'] as String?,
      imageUrl: data['imageUrl'] as String?,
      audioUrl: data['audioUrl'] as String?,
      duration: data['duration'] as int?,
      fileSize: data['fileSize'] as int?,
      imageWidth: data['imageWidth'] as int?,
      imageHeight: data['imageHeight'] as int?,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderId': senderId,
      'content': content,
      'type': type.name,
      'createdAt': FieldValue.serverTimestamp(),
      'status': status.name,
      if (deliveredAt != null) 'deliveredAt': Timestamp.fromDate(deliveredAt!),
      if (readAt != null) 'readAt': Timestamp.fromDate(readAt!),
      if (errorMessage != null) 'errorMessage': errorMessage,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (audioUrl != null) 'audioUrl': audioUrl,
      if (duration != null) 'duration': duration,
      if (fileSize != null) 'fileSize': fileSize,
      if (imageWidth != null) 'imageWidth': imageWidth,
      if (imageHeight != null) 'imageHeight': imageHeight,
    };
  }

  static MessageType _parseMessageType(String? value) {
    if (value == null) return MessageType.text;
    return MessageType.values.asNameMap()[value] ?? MessageType.text;
  }

  static MessageStatus _parseStatus(String? value) {
    if (value == null) return MessageStatus.sent;
    try {
      return MessageStatus.values.byName(value);
    } catch (_) {
      return MessageStatus.sent;
    }
  }

  bool get isDelivered => status.index >= MessageStatus.delivered.index;
  bool get isRead => status == MessageStatus.read;
  bool get isFailed => status == MessageStatus.failed;
  bool get isSending => status == MessageStatus.sending;

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? content,
    MessageType? type,
    DateTime? createdAt,
    DateTime? deliveredAt,
    DateTime? readAt,
    MessageStatus? status,
    String? errorMessage,
    String? imageUrl,
    String? audioUrl,
    int? duration,
    int? fileSize,
    int? imageWidth,
    int? imageHeight,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      deliveredAt: deliveredAt ?? this.deliveredAt,
      readAt: readAt ?? this.readAt,
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
      imageUrl: imageUrl ?? this.imageUrl,
      audioUrl: audioUrl ?? this.audioUrl,
      duration: duration ?? this.duration,
      fileSize: fileSize ?? this.fileSize,
      imageWidth: imageWidth ?? this.imageWidth,
      imageHeight: imageHeight ?? this.imageHeight,
    );
  }
}

/// Modèle de conversation
class Conversation {
  final String id;
  final List<String> participants;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final DateTime createdAt;
  final Map<String, int> unreadCount; // userId -> count

  const Conversation({
    required this.id,
    required this.participants,
    this.lastMessage,
    this.lastMessageAt,
    required this.createdAt,
    this.unreadCount = const {},
  });

  factory Conversation.fromFirestore(Map<String, dynamic> data, String conversationId) {
    final createdAt = data['createdAt'];
    final lastMessageAt = data['lastMessageAt'];
    return Conversation(
      id: conversationId,
      participants: List<String>.from(data['participants'] as List? ?? const []),
      lastMessage: data['lastMessage'] as String?,
      lastMessageAt: lastMessageAt is Timestamp
          ? lastMessageAt.toDate()
          : null,
      createdAt: createdAt is Timestamp ? createdAt.toDate() : DateTime.now(),
      unreadCount: Map<String, int>.from(data['unreadCount'] as Map? ?? {}),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'participants': participants,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt != null
          ? Timestamp.fromDate(lastMessageAt!)
          : FieldValue.serverTimestamp(),
      'createdAt': createdAt is Timestamp ? createdAt : Timestamp.fromDate(createdAt),
      'unreadCount': unreadCount,
    };
  }

  /// Retourne l'ID de l'autre participant dans la conversation
  String? getOtherParticipant(String myUserId) {
    if (participants.length != 2) return null;
    final other = participants.firstWhere((id) => id != myUserId, orElse: () => '');
    return other.isEmpty ? null : other;
  }

  /// Retourne le nombre de messages non lus pour un utilisateur
  int getUnreadCount(String userId) {
    return unreadCount[userId] ?? 0;
  }

  Conversation copyWith({
    String? id,
    List<String>? participants,
    String? lastMessage,
    DateTime? lastMessageAt,
    DateTime? createdAt,
    Map<String, int>? unreadCount,
  }) {
    return Conversation(
      id: id ?? this.id,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      createdAt: createdAt ?? this.createdAt,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}
