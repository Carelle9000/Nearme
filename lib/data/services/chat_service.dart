import 'dart:typed_data';

import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

import '../models/conversation.dart';

/// Service de chat pour Realtime Database
/// Structure: matches/{matchId}/messages/{messageId}
class ChatService {
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  String _generateMatchId(String user1, String user2) {
    return user1.compareTo(user2) <= 0 ? '${user1}_$user2' : '${user2}_$user1';
  }

  /// Crée ou récupère une conversation (match) entre deux utilisateurs
  Future<String?> createConversation(String user1, String user2) async {
    try {
      final matchId = _generateMatchId(user1, user2);
      final matchRef = _db.ref('matches/$matchId');

      final snapshot = await matchRef.get();

      if (!snapshot.exists) {
        // Créer le match
        await matchRef.set({
          'userId1': user1,
          'userId2': user2,
          'matchedAt': DateTime.now().millisecondsSinceEpoch,
        });
      }

      return matchId;
    } catch (e) {
      debugPrint('❌ Error creating conversation: $e');
      return null;
    }
  }

  /// Envoie un message texte
  Future<void> sendTextMessage(
    String matchId,
    String senderId,
    String content,
  ) async {
    try {
      final messageRef = _db.ref('matches/$matchId/messages').push();

      await messageRef.set({
        'senderId': senderId,
        'text': content,
        'sentAt': DateTime.now().millisecondsSinceEpoch,
        'type': 'text',
      });

      if (kDebugMode) {
        debugPrint('✓ Message sent: ${messageRef.key}');
      }
    } catch (e) {
      debugPrint('❌ Error sending message: $e');
      rethrow;
    }
  }

  /// Envoie un message image
  Future<void> sendImageMessage(
    String matchId,
    String senderId,
    Uint8List bytes,
    String fileName,
  ) async {
    try {
      if (bytes.isEmpty) {
        throw Exception('Image bytes are empty');
      }

      // Upload l'image
      final imageUrl = await _uploadChatImage(
        matchId,
        senderId,
        bytes,
        fileName,
      );

      final messageRef = _db.ref('matches/$matchId/messages').push();

      await messageRef.set({
        'senderId': senderId,
        'text': 'Photo',
        'imageUrl': imageUrl,
        'sentAt': DateTime.now().millisecondsSinceEpoch,
        'type': 'image',
        'fileSize': bytes.length,
      });

      if (kDebugMode) {
        debugPrint('✓ Image message sent: ${messageRef.key}');
      }
    } catch (e) {
      debugPrint('❌ Error sending image: $e');
      rethrow;
    }
  }

  /// Marque les messages comme lus
  Future<void> markMessagesAsRead(
    String matchId,
    String userId,
  ) async {
    try {
      final messagesRef = _db.ref('matches/$matchId/messages');
      final snapshot = await messagesRef.get();

      if (!snapshot.exists) return;

      final messages = snapshot.value as Map<dynamic, dynamic>?;
      if (messages == null) return;

      // Marquer tous les messages non-lus reçus comme lus
      for (final messageId in messages.keys) {
        final msg = messages[messageId] as Map<dynamic, dynamic>;
        final senderId = msg['senderId'] as String?;

        // Marquer comme lu si c'est un message reçu (pas du sender)
        if (senderId != null && senderId != userId && msg['readAt'] == null) {
          await messagesRef.child(messageId).update({
            'readAt': DateTime.now().millisecondsSinceEpoch,
          });
        }
      }

      if (kDebugMode) {
        debugPrint('✓ Messages marked as read');
      }
    } catch (e) {
      debugPrint('❌ Error marking messages as read: $e');
    }
  }

  /// Supprime une conversation
  Future<void> deleteConversation(String matchId) async {
    try {
      await _db.ref('matches/$matchId/messages').remove();
      await _db.ref('matches/$matchId').remove();

      if (kDebugMode) {
        debugPrint('✓ Conversation deleted: $matchId');
      }
    } catch (e) {
      debugPrint('❌ Error deleting conversation: $e');
      rethrow;
    }
  }

  /// Stream des messages d'une conversation
  Stream<List<ChatMessage>> getConversationMessages(String matchId) {
    return _db
        .ref('matches/$matchId/messages')
        .onValue
        .map((event) {
          if (!event.snapshot.exists) return <ChatMessage>[];

          final messages = <ChatMessage>[];
          final data = event.snapshot.value as Map<dynamic, dynamic>;

          data.forEach((key, value) {
            if (value is Map<dynamic, dynamic>) {
              try {
                messages.add(_parseMessage(key as String, value));
              } catch (e) {
                debugPrint('Error parsing message: $e');
              }
            }
          });

          // Trier par timestamp
          messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
          return messages;
        })
        .handleError((error) {
          debugPrint('❌ Error loading messages: $error');
          return <ChatMessage>[];
        });
  }

  /// Récupère une conversation
  Future<Conversation?> getConversation(String matchId) async {
    try {
      final snapshot = await _db.ref('matches/$matchId').get();
      if (!snapshot.exists) return null;

      final data = snapshot.value as Map<dynamic, dynamic>;
      return _parseConversation(matchId, data);
    } catch (e) {
      debugPrint('❌ Error getting conversation: $e');
      return null;
    }
  }

  /// Stream des conversations de l'utilisateur
  Stream<List<Conversation>> getUserConversations(String userId) {
    return _db
        .ref('matches')
        .onValue
        .map((event) {
          if (!event.snapshot.exists) return <Conversation>[];

          final conversations = <Conversation>[];
          final data = event.snapshot.value as Map<dynamic, dynamic>;

          data.forEach((key, value) {
            if (value is Map<dynamic, dynamic>) {
              try {
                final userId1 = value['userId1'] as String?;
                final userId2 = value['userId2'] as String?;

                // Inclure seulement les matches où l'utilisateur participe
                if (userId1 == userId || userId2 == userId) {
                  conversations.add(_parseConversation(key as String, value));
                }
              } catch (e) {
                debugPrint('Error parsing conversation: $e');
              }
            }
          });

          return conversations;
        })
        .handleError((error) {
          debugPrint('❌ Error loading conversations: $error');
          return <Conversation>[];
        });
  }

  /// Définit le statut "en train d'écrire"
  Future<void> setTypingStatus(
    String matchId,
    String userId,
    bool isTyping,
  ) async {
    try {
      if (isTyping) {
        await _db.ref('matches/$matchId/typing/$userId').set(
          DateTime.now().millisecondsSinceEpoch,
        );
      } else {
        await _db.ref('matches/$matchId/typing/$userId').remove();
      }
    } catch (e) {
      debugPrint('❌ Error setting typing status: $e');
    }
  }

  /// Stream du statut "en train d'écrire"
  Stream<Map<String, bool>> getTypingStatus(String matchId) {
    return _db
        .ref('matches/$matchId/typing')
        .onValue
        .map((event) {
          final typingUsers = <String, bool>{};
          if (!event.snapshot.exists) return typingUsers;

          final data = event.snapshot.value as Map<dynamic, dynamic>;
          final now = DateTime.now().millisecondsSinceEpoch;

          data.forEach((userId, timestamp) {
            if (timestamp is int) {
              final timeDiff = now - timestamp;
              // Expire après 10 secondes
              if (timeDiff < 10000) {
                typingUsers[userId as String] = true;
              }
            }
          });

          return typingUsers;
        });
  }

  /// Bloque un utilisateur
  Future<void> blockUser(String blockerId, String blockedId) async {
    try {
      final blockId = _generateMatchId(blockerId, blockedId);
      await _db.ref('blocks/$blockId').set({
        'blockerId': blockerId,
        'blockedId': blockedId,
        'createdAt': DateTime.now().millisecondsSinceEpoch,
      });

      if (kDebugMode) {
        debugPrint('✓ User blocked: $blockedId');
      }
    } catch (e) {
      debugPrint('❌ Error blocking user: $e');
      rethrow;
    }
  }

  /// Débloque un utilisateur
  Future<void> unblockUser(String blockerId, String blockedId) async {
    try {
      final blockId = _generateMatchId(blockerId, blockedId);
      await _db.ref('blocks/$blockId').remove();

      if (kDebugMode) {
        debugPrint('✓ User unblocked: $blockedId');
      }
    } catch (e) {
      debugPrint('❌ Error unblocking user: $e');
      rethrow;
    }
  }

  /// Vérifie si un utilisateur est bloqué
  Future<bool> isBlocked(String userId1, String userId2) async {
    try {
      final blockId = _generateMatchId(userId1, userId2);
      final snapshot = await _db.ref('blocks/$blockId').get();
      return snapshot.exists;
    } catch (e) {
      debugPrint('❌ Error checking if blocked: $e');
      return false;
    }
  }

  /// Signale un utilisateur
  Future<void> reportUser(
    String reporterId,
    String reportedUserId,
    String reason,
  ) async {
    try {
      await _db.ref('reports').push().set({
        'reporterId': reporterId,
        'reportedUserId': reportedUserId,
        'reason': reason,
        'createdAt': DateTime.now().millisecondsSinceEpoch,
        'status': 'pending',
      });

      if (kDebugMode) {
        debugPrint('✓ User reported: $reportedUserId');
      }
    } catch (e) {
      debugPrint('❌ Error reporting user: $e');
      rethrow;
    }
  }

  /// Stream des utilisateurs bloqués
  Stream<List<String>> getBlockedUsers(String userId) {
    return _db
        .ref('blocks')
        .onValue
        .map((event) {
          if (!event.snapshot.exists) return <String>[];

          final blockedUsers = <String>[];
          final data = event.snapshot.value as Map<dynamic, dynamic>;

          data.forEach((key, value) {
            if (value is Map<dynamic, dynamic>) {
              final blockerId = value['blockerId'] as String?;
              final blockedId = value['blockedId'] as String?;

              if (blockerId == userId && blockedId != null) {
                blockedUsers.add(blockedId);
              }
            }
          });

          return blockedUsers;
        });
  }

  /// Upload une image de chat
  Future<String> _uploadChatImage(
    String matchId,
    String senderId,
    Uint8List bytes,
    String fileName,
  ) async {
    try {
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      if (bytes.length > maxFileSize) {
        throw Exception('Image too large (max 5MB)');
      }

      final safeName = fileName.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final storagePath = 'chat_images/$matchId/$senderId/${timestamp}_$safeName';

      final ref = FirebaseStorage.instance.ref(storagePath);
      await ref.putData(
        bytes,
        SettableMetadata(
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=86400',
        ),
      );

      final downloadUrl = await ref.getDownloadURL();

      if (kDebugMode) {
        debugPrint('✓ Image uploaded: $storagePath');
      }

      return downloadUrl;
    } catch (e) {
      debugPrint('❌ Error uploading chat image: $e');
      rethrow;
    }
  }

  /// Parse un message depuis les données Realtime DB
  ChatMessage _parseMessage(String messageId, Map<dynamic, dynamic> data) {
    final senderId = data['senderId'] as String? ?? '';
    final text = data['text'] as String? ?? '';
    final sentAt = data['sentAt'] as int? ?? DateTime.now().millisecondsSinceEpoch;
    final readAt = data['readAt'] as int?;
    final type = data['type'] as String? ?? 'text';
    final imageUrl = data['imageUrl'] as String?;
    final fileSize = data['fileSize'] as int?;

    return ChatMessage(
      id: messageId,
      senderId: senderId,
      content: text,
      type: type == 'image' ? MessageType.image : MessageType.text,
      createdAt: DateTime.fromMillisecondsSinceEpoch(sentAt),
      imageUrl: imageUrl,
      fileSize: fileSize,
      readAt: readAt != null ? DateTime.fromMillisecondsSinceEpoch(readAt) : null,
      status: readAt != null ? MessageStatus.read : MessageStatus.sent,
    );
  }

  /// Parse une conversation depuis les données Realtime DB
  Conversation _parseConversation(
    String matchId,
    Map<dynamic, dynamic> data,
  ) {
    final userId1 = data['userId1'] as String? ?? '';
    final userId2 = data['userId2'] as String? ?? '';
    final matchedAt = data['matchedAt'] as int?;
    final messagesData = data['messages'] as Map<dynamic, dynamic>?;

    String? lastMessage;
    DateTime? lastMessageAt;

    if (messagesData != null && messagesData.isNotEmpty) {
      final messages = <int, String>{};
      messagesData.forEach((key, value) {
        if (value is Map<dynamic, dynamic>) {
          final sentAt = value['sentAt'] as int? ?? 0;
          final text = value['text'] as String? ?? '';
          messages[sentAt] = text;
        }
      });

      if (messages.isNotEmpty) {
        final latestTime = messages.keys.reduce((a, b) => a > b ? a : b);
        lastMessage = messages[latestTime];
        lastMessageAt = DateTime.fromMillisecondsSinceEpoch(latestTime);
      }
    }

    return Conversation(
      id: matchId,
      participants: [userId1, userId2],
      lastMessage: lastMessage,
      lastMessageAt: lastMessageAt,
      createdAt: matchedAt != null
          ? DateTime.fromMillisecondsSinceEpoch(matchedAt)
          : DateTime.now(),
    );
  }
}
