import 'package:flutter/foundation.dart';

import '../../data/models/profile.dart';

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
  final List<MatchEntry> _matches = [];
  int _nextId = 1;

  List<MatchEntry> get matches => List.unmodifiable(_matches);
  int get count => _matches.length;
  int get unreadCount => _matches.where((m) => m.hasUnread).length;

  // ──────────────────────────────────────────────────────────────────────────
  // Mutations
  // ──────────────────────────────────────────────────────────────────────────

  void addMatch(Profile profile) {
    _matches.insert(
      0,
      MatchEntry(
        id: '${_nextId++}',
        profile: profile,
        matchedAt: DateTime.now(),
      ),
    );
    notifyListeners();
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

    // Simulate an auto-reply
    Future.delayed(const Duration(milliseconds: 1800), () {
      final i = _matches.indexWhere((m) => m.id == matchId);
      if (i < 0) return;
      final cur = _matches[i];
      _matches[i] = cur.copyWith(
        messages: [
          ...cur.messages,
          ChatMessage(
            text: _autoReply(cur.profile.name),
            fromMe: false,
            timestamp: DateTime.now(),
          ),
        ],
        // Do NOT advance readCount — the reply is unread until user opens chat
      );
      notifyListeners();
    });
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
