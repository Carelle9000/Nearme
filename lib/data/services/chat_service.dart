import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/conversation.dart';

/// Service de messagerie pour NearMe
/// Gère les conversations et messages avec Firestore
class ChatService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Génère un ID de conversation unique basé sur les IDs des participants
  String _generateConversationId(String user1, String user2) {
    return user1.compareTo(user2) <= 0 ? '${user1}_$user2' : '${user2}_$user1';
  }

  /// Vérifie si un match existe entre deux utilisateurs
  Future<bool> checkMatchExists(String user1, String user2) async {
    final matchId = _generateConversationId(user1, user2);
    final matchDoc = await _db.collection('matches').doc(matchId).get();
    return matchDoc.exists;
  }

  /// Crée une nouvelle conversation entre deux utilisateurs
  /// Vérifie d'abord si un match existe
  Future<String?> createConversation(String user1, String user2) async {
    // Vérifier si le match existe
    final matchExists = await checkMatchExists(user1, user2);
    if (!matchExists) {
      throw Exception('No match exists between these users');
    }

    final conversationId = _generateConversationId(user1, user2);
    
    // Vérifier si la conversation existe déjà
    final existingConv = await _db.collection('conversations').doc(conversationId).get();
    if (existingConv.exists) {
      return conversationId;
    }

    // Créer la conversation
    await _db.collection('conversations').doc(conversationId).set({
      'participants': [user1, user2],
      'lastMessage': null,
      'lastMessageAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
      'unreadCount': {user1: 0, user2: 0},
    });

    return conversationId;
  }

  /// Envoie un message texte
  Future<void> sendTextMessage(
    String conversationId,
    String senderId,
    String content,
  ) async {
    final messageRef = _db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc();

    final message = ChatMessage(
      id: messageRef.id,
      senderId: senderId,
      content: content,
      type: MessageType.text,
      createdAt: DateTime.now(),
    );

    await messageRef.set(message.toFirestore());

    // Mettre à jour la conversation
    await _db.collection('conversations').doc(conversationId).update({
      'lastMessage': content,
      'lastMessageAt': FieldValue.serverTimestamp(),
      'unreadCount': FieldValue.increment(1),
    });
  }

  /// Envoie un message image
  /// Note: Pour l'instant, cette méthode est simplifiée. 
  /// En production, utiliser le service d'upload existant ou implémenter l'upload Firebase Storage complet.
  Future<void> sendImageMessage(
    String conversationId,
    String senderId,
    String imageUrl,
  ) async {
    final messageRef = _db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc();

    final message = ChatMessage(
      id: messageRef.id,
      senderId: senderId,
      content: '📷 Photo',
      type: MessageType.image,
      createdAt: DateTime.now(),
      imageUrl: imageUrl,
    );

    await messageRef.set(message.toFirestore());

    // Mettre à jour la conversation
    await _db.collection('conversations').doc(conversationId).update({
      'lastMessage': '📷 Photo',
      'lastMessageAt': FieldValue.serverTimestamp(),
      'unreadCount': FieldValue.increment(1),
    });
  }

  /// Marque les messages comme lus pour un utilisateur
  Future<void> markMessagesAsRead(
    String conversationId,
    String userId,
  ) async {
    // Réinitialiser le compteur de non-lus pour cet utilisateur
    await _db.collection('conversations').doc(conversationId).update({
      'unreadCount.$userId': 0,
    });

    // Marquer tous les messages non lus de l'autre utilisateur comme lus
    final messagesSnapshot = await _db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .where('read', isEqualTo: false)
        .where('senderId', isNotEqualTo: userId)
        .get();

    final batch = _db.batch();
    for (final doc in messagesSnapshot.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  /// Supprime une conversation
  Future<void> deleteConversation(String conversationId) async {
    // Supprimer tous les messages
    final messagesSnapshot = await _db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .get();

    final batch = _db.batch();
    for (final doc in messagesSnapshot.docs) {
      batch.delete(doc.reference);
    }
    await batch.commit();

    // Supprimer la conversation
    await _db.collection('conversations').doc(conversationId).delete();
  }

  /// Stream des conversations d'un utilisateur
  Stream<List<Conversation>> getUserConversations(String userId) {
    return _db
        .collection('conversations')
        .where('participants', arrayContains: userId)
        .orderBy('lastMessageAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Conversation.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Stream des messages d'une conversation
  Stream<List<ChatMessage>> getConversationMessages(String conversationId) {
    return _db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatMessage.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Récupère une conversation spécifique
  Future<Conversation?> getConversation(String conversationId) async {
    final doc = await _db.collection('conversations').doc(conversationId).get();
    if (!doc.exists) return null;
    final data = doc.data();
    if (data == null) return null;
    return Conversation.fromFirestore(data, doc.id);
  }

  /// Met à jour le statut "en train d'écrire"
  Future<void> setTypingStatus(
    String conversationId,
    String userId,
    bool isTyping,
  ) async {
    await _db
        .collection('conversations')
        .doc(conversationId)
        .collection('typing')
        .doc(userId)
        .set({
      'isTyping': isTyping,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  /// Stream du statut "en train d'écrire" pour une conversation
  Stream<Map<String, bool>> getTypingStatus(String conversationId) {
    return _db
        .collection('conversations')
        .doc(conversationId)
        .collection('typing')
        .snapshots()
        .map((snapshot) {
      final Map<String, bool> typingUsers = {};
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final isTyping = data['isTyping'] as bool? ?? false;
        final timestamp = data['timestamp'] as Timestamp?;
        
        // Ne considérer comme "en train d'écrire" que si c'est il y a moins de 10 secondes
        if (isTyping && timestamp != null) {
          final timeDiff = DateTime.now().difference(timestamp.toDate());
          if (timeDiff.inSeconds < 10) {
            typingUsers[doc.id] = true;
          }
        }
      }
      return typingUsers;
    });
  }

  /// Bloque un utilisateur
  Future<void> blockUser(String blockerId, String blockedId) async {
    final blockId = _generateConversationId(blockerId, blockedId);
    await _db.collection('blocks').doc(blockId).set({
      'blockerId': blockerId,
      'blockedId': blockedId,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  /// Débloque un utilisateur
  Future<void> unblockUser(String blockerId, String blockedId) async {
    final blockId = _generateConversationId(blockerId, blockedId);
    await _db.collection('blocks').doc(blockId).delete();
  }

  /// Vérifie si un utilisateur est bloqué
  Future<bool> isBlocked(String userId1, String userId2) async {
    final blockId = _generateConversationId(userId1, userId2);
    final doc = await _db.collection('blocks').doc(blockId).get();
    return doc.exists;
  }

  /// Signale un utilisateur
  Future<void> reportUser(
    String reporterId,
    String reportedUserId,
    String reason,
  ) async {
    await _db.collection('reports').add({
      'reporterId': reporterId,
      'reportedUserId': reportedUserId,
      'reason': reason,
      'createdAt': FieldValue.serverTimestamp(),
      'status': 'pending',
    });
  }

  /// Récupère la liste des utilisateurs bloqués
  Stream<List<String>> getBlockedUsers(String userId) {
    return _db
        .collection('blocks')
        .where('blockerId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => doc.data()['blockedId'] as String)
            .toList());
  }
}
