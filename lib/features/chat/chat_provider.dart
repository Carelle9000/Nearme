import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import '../../data/models/conversation.dart';
import '../../data/models/app_user.dart';
import '../../data/services/chat_service.dart';
import '../../data/services/user_service.dart';

/// Provider pour la gestion de la messagerie
class ChatProvider extends ChangeNotifier {
  final ChatService _chatService = ChatService();
  final UserService _userService = UserService();

  List<Conversation> _conversations = [];
  Map<String, List<ChatMessage>> _messages = {}; // conversationId -> messages
  Map<String, AppUser> _userProfiles = {}; // userId -> profile
  Map<String, Map<String, bool>> _typingStatus = {}; // conversationId -> {userId: isTyping}
  List<String> _blockedUsers = [];

  StreamSubscription? _conversationsSubscription;
  StreamSubscription? _typingSubscription;
  StreamSubscription? _blockedUsersSubscription;
  
  bool _isLoading = false;
  String? _currentConversationId;
  Timer? _typingTimer;

  List<Conversation> get conversations => List.unmodifiable(_conversations);
  List<ChatMessage> getMessages(String conversationId) => 
      _messages[conversationId] ?? [];
  AppUser? getUserProfile(String userId) => _userProfiles[userId];
  Map<String, bool> getTypingStatus(String conversationId) => 
      _typingStatus[conversationId] ?? {};
  List<String> get blockedUsers => List.unmodifiable(_blockedUsers);
  bool get isLoading => _isLoading;
  String? get currentConversationId => _currentConversationId;

  int get totalUnreadCount => _conversations.fold(
    0, 
    (sum, conv) => sum + conv.getUnreadCount(auth.FirebaseAuth.instance.currentUser?.uid ?? ''),
  );

  /// Initialise le provider pour un utilisateur
  void init(String userId) {
    _isLoading = true;
    notifyListeners();

    // Écouter les conversations
    _conversationsSubscription = _chatService.getUserConversations(userId).listen(
      (conversations) async {
        _conversations = conversations;
        
        // Charger les profils des participants
        for (final conv in conversations) {
          for (final participantId in conv.participants) {
            if (participantId != userId && !_userProfiles.containsKey(participantId)) {
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
        debugPrint('Error loading conversations: $error');
        _isLoading = false;
        notifyListeners();
      },
    );

    // Écouter les utilisateurs bloqués
    _blockedUsersSubscription = _chatService.getBlockedUsers(userId).listen(
      (blockedUsers) {
        _blockedUsers = blockedUsers;
        notifyListeners();
      },
      onError: (error) {
        debugPrint('Error loading blocked users: $error');
      },
    );
  }

  /// Charge les messages d'une conversation
  void loadConversationMessages(String conversationId) {
    _currentConversationId = conversationId;
    
    // Annuler l'ancien abonnement s'il existe
    // Note: Pour simplifier, on pourrait garder un Map de subscriptions
    
    _chatService.getConversationMessages(conversationId).listen(
      (messages) {
        _messages[conversationId] = messages;
        
        // Écouter le statut "en train d'écrire"
        _typingSubscription?.cancel();
        _typingSubscription = _chatService.getTypingStatus(conversationId).listen(
          (typingStatus) {
            _typingStatus[conversationId] = typingStatus;
            notifyListeners();
          },
        );
        
        notifyListeners();
      },
      onError: (error) {
        debugPrint('Error loading messages: $error');
      },
    );
  }

  /// Envoie un message texte
  Future<bool> sendTextMessage(String conversationId, String content) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.sendTextMessage(conversationId, userId, content);
      return true;
    } catch (e) {
      debugPrint('Error sending message: $e');
      return false;
    }
  }

  /// Envoie un message image
  Future<bool> sendImageMessage(String conversationId, String imageUrl) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.sendImageMessage(conversationId, userId, imageUrl);
      return true;
    } catch (e) {
      debugPrint('Error sending image: $e');
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
      debugPrint('Error marking as read: $e');
    }
  }

  /// Supprime une conversation
  Future<bool> deleteConversation(String conversationId) async {
    try {
      await _chatService.deleteConversation(conversationId);
      
      // Retirer de la liste locale
      _conversations.removeWhere((c) => c.id == conversationId);
      _messages.remove(conversationId);
      _typingStatus.remove(conversationId);
      
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error deleting conversation: $e');
      return false;
    }
  }

  /// Met à jour le statut "en train d'écrire"
  void setTypingStatus(String conversationId, bool isTyping) {
    final userId = auth.FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) return;

    _chatService.setTypingStatus(conversationId, userId, isTyping);

    // Annuler le timer précédent
    _typingTimer?.cancel();

    // Si l'utilisateur arrête d'écrire, arrêter le statut après 3 secondes
    if (isTyping) {
      _typingTimer = Timer(const Duration(seconds: 3), () {
        _chatService.setTypingStatus(conversationId, userId, false);
      });
    }
  }

  /// Bloque un utilisateur
  Future<bool> blockUser(String blockedUserId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.blockUser(userId, blockedUserId);
      
      // Ajouter à la liste locale
      if (!_blockedUsers.contains(blockedUserId)) {
        _blockedUsers.add(blockedUserId);
        notifyListeners();
      }
      
      return true;
    } catch (e) {
      debugPrint('Error blocking user: $e');
      return false;
    }
  }

  /// Débloque un utilisateur
  Future<bool> unblockUser(String blockedUserId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return false;

      await _chatService.unblockUser(userId, blockedUserId);
      
      // Retirer de la liste locale
      _blockedUsers.remove(blockedUserId);
      notifyListeners();
      
      return true;
    } catch (e) {
      debugPrint('Error unblocking user: $e');
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
      debugPrint('Error reporting user: $e');
      return false;
    }
  }

  /// Vérifie si un utilisateur est bloqué
  bool isUserBlocked(String userId) {
    return _blockedUsers.contains(userId);
  }

  /// Crée une nouvelle conversation (avec vérification de match)
  Future<String?> createConversation(String otherUserId) async {
    try {
      final userId = auth.FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) return null;

      return await _chatService.createConversation(userId, otherUserId);
    } catch (e) {
      debugPrint('Error creating conversation: $e');
      return null;
    }
  }

  @override
  void dispose() {
    _conversationsSubscription?.cancel();
    _typingSubscription?.cancel();
    _blockedUsersSubscription?.cancel();
    _typingTimer?.cancel();
    super.dispose();
  }
}
