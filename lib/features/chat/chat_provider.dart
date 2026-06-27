import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import '../../core/sync/message_queue.dart';
import '../../core/utils/image_processor.dart';
import '../../data/models/conversation.dart';
import '../../data/models/app_user.dart';
import '../../data/services/chat_service.dart';
import '../../data/services/user_service.dart';

/// Provider pour la gestion de la messagerie avec:
/// - Message state tracking (sending, sent, delivered, read, failed)
/// - Offline message queue
/// - Automatic retry logic
/// - User blocking & reporting
class ChatProvider extends ChangeNotifier {
  final ChatService _chatService = ChatService();
  final UserService _userService = UserService();
  final MessageQueue _messageQueue = MessageQueue();

  List<Conversation> _conversations = [];
  Map<String, List<ChatMessage>> _messages = {}; // conversationId -> messages
  Map<String, AppUser> _userProfiles = {}; // userId -> profile
  Map<String, Map<String, bool>> _typingStatus = {}; // conversationId -> {userId: isTyping}
  List<String> _blockedUsers = [];

  StreamSubscription? _conversationsSubscription;
  StreamSubscription? _messagesSubscription;
  StreamSubscription? _typingSubscription;
  StreamSubscription? _blockedUsersSubscription;
  Timer? _retryTimer;
  Timer? _typingTimer;

  bool _isLoading = false;
  String? _initializedUserId;
  String? _currentConversationId;

  List<Conversation> get conversations => List.unmodifiable(_conversations);
  List<ChatMessage> getMessages(String conversationId) =>
      _messages[conversationId] ?? [];
  AppUser? getUserProfile(String userId) => _userProfiles[userId];
  Map<String, bool> getTypingStatus(String conversationId) =>
      _typingStatus[conversationId] ?? {};
  List<String> get blockedUsers => List.unmodifiable(_blockedUsers);
  bool get isLoading => _isLoading;
  String? get currentConversationId => _currentConversationId;
  int get pendingMessageCount => _messageQueue.size;

  int get totalUnreadCount => _conversations.fold(
    0,
    (sum, conv) =>
        sum +
        conv.getUnreadCount(auth.FirebaseAuth.instance.currentUser?.uid ?? ''),
  );

  /// Initialise le provider pour un utilisateur
  void init(String userId) {
    if (_initializedUserId == userId && _conversationsSubscription != null) {
      return;
    }

    _conversationsSubscription?.cancel();
    _blockedUsersSubscription?.cancel();
    _initializedUserId = userId;

    _isLoading = true;
    notifyListeners();

    // Écouter les conversations
    _conversationsSubscription =
        _chatService.getUserConversations(userId).listen(
      (conversations) async {
        _conversations = conversations;

        // Charger les profils des participants
        for (final conv in conversations) {
          for (final participantId in conv.participants) {
            if (participantId != userId &&
                !_userProfiles.containsKey(participantId)) {
              final profile = await _userService.getUserById(participantId);
              if (profile != null) {
                _userProfiles[participantId] = profile;
              }
            }
          }
        }

        _isLoading = false;
        notifyListeners();
      },
      onError: (error) {
        debugPrint('❌ Error loading conversations: $error');
        _isLoading = false;
        notifyListeners();
      },
    );

    // Écouter les utilisateurs bloqués
    _blockedUsersSubscription =
        _chatService.getBlockedUsers(userId).listen(
      (blockedUsers) {
        _blockedUsers = blockedUsers;
        notifyListeners();
      },
      onError: (error) {
        debugPrint('❌ Error loading blocked users: $error');
      },
    );

    // Démarrer le retry timer pour la message queue
    _startRetryTimer(userId);
  }

  /// Démarre le timer pour retry des messages échoués
  void _startRetryTimer(String userId) {
    _retryTimer?.cancel();
    _retryTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      final readyToRetry = _messageQueue.getReadyToRetry();
      for (final pending in readyToRetry) {
        await _retryMessage(pending, userId);
      }
    });
  }

  /// Retry un message échoué
  Future<void> _retryMessage(PendingMessage pending, String userId) async {
    try {
      _messageQueue.markRetried(pending.id);

      if (pending.message.type == MessageType.text) {
        await _chatService.sendTextMessage(
          pending.conversationId,
          userId,
          pending.message.content,
        );
      } else if (pending.message.type == MessageType.image &&
          pending.message.imageUrl != null) {
        // Pour les images, on ne peut pas retry automatiquement
        // car on n'a pas accès aux bytes
        return;
      }

      _messageQueue.remove(pending.id);
      notifyListeners();

      if (kDebugMode) {
        debugPrint('✓ Message retried successfully: ${pending.id}');
      }
    } catch (e) {
      debugPrint('Error retrying message: $e');
    }
  }

  /// Charge les messages d'une conversation
  void loadConversationMessages(String conversationId) {
    _currentConversationId = conversationId;

    _messagesSubscription?.cancel();
    _messagesSubscription =
        _chatService.getConversationMessages(conversationId).listen(
      (messages) {
        _messages[conversationId] = messages;

        // Écouter le statut "en train d'écrire"
        _typingSubscription?.cancel();
        _typingSubscription =
            _chatService.getTypingStatus(conversationId).listen(
          (typingStatus) {
            _typingStatus[conversationId] = typingStatus;
            notifyListeners();
          },
        );

        notifyListeners();
      },
      onError: (error) {
        debugPrint('❌ Error loading messages: $error');
      },
    );
  }

  /// Envoie un message texte avec validation
  Future<bool> sendTextMessage(String conversationId, String content) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      if (content.trim().isEmpty) {
        return false;
      }

      await _chatService.sendTextMessage(conversationId, userId, content);
      return true;
    } catch (e) {
      debugPrint('❌ Error sending message: $e');
      return false;
    }
  }

  /// Envoie un message image avec compression et validation
  Future<bool> sendImageMessage(
    String conversationId,
    Uint8List bytes,
    String fileName,
  ) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      // Traiter et compresser l'image
      final result = await ImageProcessor.processImageForChat(bytes);
      if (!result.success || result.compressedBytes == null) {
        debugPrint('❌ Image processing failed: ${result.error}');
        return false;
      }

      // Envoyer l'image compressée
      await _chatService.sendImageMessage(
        conversationId,
        userId,
        result.compressedBytes!,
        fileName,
      );

      return true;
    } catch (e) {
      debugPrint('❌ Error sending image: $e');
      return false;
    }
  }

  /// Marque les messages comme lus
  Future<void> markAsRead(String conversationId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return;

      await _chatService.markMessagesAsRead(conversationId, userId);

      // Mettre à jour localement
      final idx = _conversations.indexWhere((c) => c.id == conversationId);
      if (idx >= 0) {
        final conv = _conversations[idx];
        final updatedUnreadCount = Map<String, int>.from(conv.unreadCount);
        updatedUnreadCount[userId] = 0;
        _conversations[idx] = conv.copyWith(unreadCount: updatedUnreadCount);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('❌ Error marking as read: $e');
    }
  }

  /// Supprime une conversation
  Future<bool> deleteConversation(String conversationId) async {
    try {
      await _chatService.deleteConversation(conversationId);

      _conversations.removeWhere((c) => c.id == conversationId);
      _messages.remove(conversationId);
      _typingStatus.remove(conversationId);

      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('❌ Error deleting conversation: $e');
      return false;
    }
  }

  /// Met à jour le statut "en train d'écrire"
  void setTypingStatus(String conversationId, bool isTyping) {
    final userId = auth.FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) return;

    _chatService.setTypingStatus(conversationId, userId, isTyping);

    _typingTimer?.cancel();

    if (isTyping) {
      _typingTimer = Timer(const Duration(seconds: 3), () {
        final uid = auth.FirebaseAuth.instance.currentUser?.uid;
        if (uid != null) {
          _chatService.setTypingStatus(conversationId, uid, false);
        }
      });
    }
  }

  /// Bloque un utilisateur
  Future<bool> blockUser(String blockedUserId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.blockUser(userId, blockedUserId);

      if (!_blockedUsers.contains(blockedUserId)) {
        _blockedUsers.add(blockedUserId);
        notifyListeners();
      }

      return true;
    } catch (e) {
      debugPrint('❌ Error blocking user: $e');
      return false;
    }
  }

  /// Débloque un utilisateur
  Future<bool> unblockUser(String blockedUserId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.unblockUser(userId, blockedUserId);

      _blockedUsers.remove(blockedUserId);
      notifyListeners();

      return true;
    } catch (e) {
      debugPrint('❌ Error unblocking user: $e');
      return false;
    }
  }

  /// Signale un utilisateur
  Future<bool> reportUser(String reportedUserId, String reason) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.reportUser(userId, reportedUserId, reason);
      return true;
    } catch (e) {
      debugPrint('❌ Error reporting user: $e');
      return false;
    }
  }

  /// Vérifie si un utilisateur est bloqué
  bool isUserBlocked(String userId) {
    return _blockedUsers.contains(userId);
  }

  /// Crée une nouvelle conversation
  Future<String?> createConversation(String otherUserId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return null;

      return await _chatService.createConversation(userId, otherUserId);
    } catch (e) {
      debugPrint('❌ Error creating conversation: $e');
      return null;
    }
  }

  @override
  void dispose() {
    _conversationsSubscription?.cancel();
    _messagesSubscription?.cancel();
    _typingSubscription?.cancel();
    _blockedUsersSubscription?.cancel();
    _retryTimer?.cancel();
    _typingTimer?.cancel();
    super.dispose();
  }
}
