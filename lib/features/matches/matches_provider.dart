import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../data/models/profile.dart';
import '../../data/services/match_service.dart';
import '../../data/services/user_service.dart';

class ChatMessage {
  final String text;
  final bool fromMe;
  final DateTime timestamp;

  const ChatMessage({
    required this.text,
    required this.fromMe,
    required this.timestamp,
  });
}

class MatchEntry {
  final String id;
  final Profile profile;
  final DateTime matchedAt;
  final List<ChatMessage> messages;

  /// Index up to which messages have been read by the local user.
  /// Messages at index >= readCount that are !fromMe are unread.
  final int readCount;

  const MatchEntry({
    required this.id,
    required this.profile,
    required this.matchedAt,
    this.messages = const [],
    this.readCount = 0,
  });

  MatchEntry copyWith({
    List<ChatMessage>? messages,
    int? readCount,
  }) =>
      MatchEntry(
        id: id,
        profile: profile,
        matchedAt: matchedAt,
        messages: messages ?? this.messages,
        readCount: readCount ?? this.readCount,
      );

  String? get lastMessage =>
      messages.isEmpty ? null : messages.last.text;

  /// True when there is at least one received message that has not been read.
  bool get hasUnread {
    if (messages.length <= readCount) return false;
    // Check only the "new" messages above readCount
    return messages
        .skip(readCount)
        .any((m) => !m.fromMe);
  }
}

class MatchesProvider extends ChangeNotifier {
  final MatchService _matchService = MatchService();
  final UserService _userService = UserService();

  List<MatchEntry> _matches = [];
  StreamSubscription? _subscription;
  bool _isLoading = false;

  List<MatchEntry> get matches => List.unmodifiable(_matches);
  int get count => _matches.length;
  int get unreadCount => _matches.where((m) => m.hasUnread).length;
  bool get isLoading => _isLoading;

  void init(String userId) {
    _subscription?.cancel();
    _isLoading = true;
    notifyListeners();

    _subscription = _matchService.getMatchesIds(userId).listen(
      (ids) async {
        final List<MatchEntry> newMatches = [];
        final uniqueIds = ids.toSet().toList();

        for (final id in uniqueIds) {
          // Find existing match to preserve messages (for now)
          final existing = _matches.where((m) => m.profile.id == id).firstOrNull;

          if (existing != null) {
            newMatches.add(existing);
          } else {
            // Load profile from UserService
            final profile = await _userService.getProfile(id);

            if (profile != null) {
              newMatches.add(MatchEntry(
                id: id,
                profile: profile,
                matchedAt: DateTime.now(),
              ));
            }
          }
        }

        _matches = newMatches;
        _isLoading = false;
        notifyListeners();
      },
      onError: (error) {
        debugPrint('Error listening to matches: $error');
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  /// Compatibility method for local feedback (optional)
  void addMatch(Profile profile) {
    // If not already in list, add a temporary entry
    if (!_matches.any((m) => m.profile.id == profile.id)) {
      _matches.insert(0, MatchEntry(
        id: profile.id, // Using profile ID as temp match ID
        profile: profile,
        matchedAt: DateTime.now(),
      ));
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  /// Mark all current messages in [matchId] as read.
  void markAsRead(String matchId) {
    final idx = _matches.indexWhere((m) => m.id == matchId);
    if (idx < 0) return;
    final m = _matches[idx];
    if (!m.hasUnread) return;
    _matches[idx] = m.copyWith(readCount: m.messages.length);
    notifyListeners();
  }

  void sendMessage(String matchId, String text) {
    final idx = _matches.indexWhere((m) => m.id == matchId);
    if (idx < 0) return;

    final m = _matches[idx];
    final updated = m.copyWith(
      messages: [
        ...m.messages,
        ChatMessage(text: text, fromMe: true, timestamp: DateTime.now()),
      ],
      // Sent messages are implicitly "read"
      readCount: m.messages.length + 1,
    );
    _matches[idx] = updated;
    notifyListeners();

    // Auto-reply simulation disabled - using new Firestore chat system instead
    // The new ChatProvider and ConversationScreen handle real-time messaging
  }

  static String _autoReply(String name) {
    const replies = [
      "Haha, that's so true! 😄",
      "I'd love that! When are you free? 🗓️",
      "Same here! Let's grab coffee ☕",
      "Really? Tell me more! 👀",
      "Let's meet up soon 🎉",
      "I was thinking the same thing 😊",
      '😍 You seem really interesting!',
    ];
    return replies[name.codeUnitAt(0) % replies.length];
  }
}
