import 'package:cloud_firestore/cloud_firestore.dart';

enum MessageType { text, image, voice }

/// Modèle de message de conversation
class ChatMessage {
  final String id;
  final String senderId;
  final String content;
  final MessageType type;
  final DateTime createdAt;
  final bool read;
  final String? imageUrl; // Pour les messages image
  final String? audioUrl; // Pour les messages vocaux
  final int? duration; // Durée des messages vocaux en secondes

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.content,
    required this.type,
    required this.createdAt,
    this.read = false,
    this.imageUrl,
    this.audioUrl,
    this.duration,
  });

  factory ChatMessage.fromFirestore(Map<String, dynamic> data, String messageId) {
    return ChatMessage(
      id: messageId,
      senderId: data['senderId'] as String,
      content: data['content'] as String? ?? '',
      type: _parseMessageType(data['type'] as String?),
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      read: data['read'] as bool? ?? false,
      imageUrl: data['imageUrl'] as String?,
      audioUrl: data['audioUrl'] as String?,
      duration: data['duration'] as int?,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderId': senderId,
      'content': content,
      'type': type.name,
      'createdAt': FieldValue.serverTimestamp(),
      'read': read,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (audioUrl != null) 'audioUrl': audioUrl,
      if (duration != null) 'duration': duration,
    };
  }

  static MessageType _parseMessageType(String? value) {
    if (value == null) return MessageType.text;
    return MessageType.values.asNameMap()[value] ?? MessageType.text;
  }

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? content,
    MessageType? type,
    DateTime? createdAt,
    bool? read,
    String? imageUrl,
    String? audioUrl,
    int? duration,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      read: read ?? this.read,
      imageUrl: imageUrl ?? this.imageUrl,
      audioUrl: audioUrl ?? this.audioUrl,
      duration: duration ?? this.duration,
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
    return Conversation(
      id: conversationId,
      participants: List<String>.from(data['participants'] as List),
      lastMessage: data['lastMessage'] as String?,
      lastMessageAt: data['lastMessageAt'] != null
          ? (data['lastMessageAt'] as Timestamp).toDate()
          : null,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
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
    return participants.firstWhere((id) => id != myUserId, orElse: () => '');
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
