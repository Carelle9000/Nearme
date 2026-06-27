import 'package:flutter/foundation.dart';
import '../../data/models/conversation.dart';

/// Modèle pour un message en attente d'envoi
class PendingMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final ChatMessage message;
  int retryCount;
  DateTime lastRetryAt;

  PendingMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.message,
    this.retryCount = 0,
    DateTime? lastRetryAt,
  }) : lastRetryAt = lastRetryAt ?? DateTime.now();
}

/// Queue locale pour les messages non envoyés
/// Persiste en mémoire et retry automatiquement au reconnect
class MessageQueue {
  static const maxRetries = 3;
  static const retryDelaySeconds = 5;

  final Map<String, PendingMessage> _queue = {};

  /// Ajoute un message à la queue
  void add(PendingMessage pending) {
    _queue[pending.id] = pending;
    if (kDebugMode) {
      debugPrint('📤 Message added to queue: ${pending.id}');
      debugPrint('Queue size: ${_queue.length}');
    }
  }

  /// Récupère tous les messages en attente
  List<PendingMessage> getAll() => _queue.values.toList();

  /// Récupère les messages prêts à retry
  List<PendingMessage> getReadyToRetry() {
    final now = DateTime.now();
    return _queue.values.where((msg) {
      final timeSinceLastRetry =
          now.difference(msg.lastRetryAt).inSeconds;
      return msg.retryCount < maxRetries &&
          timeSinceLastRetry >= retryDelaySeconds;
    }).toList();
  }

  /// Met à jour le retry count et timestamp
  void markRetried(String messageId) {
    if (_queue.containsKey(messageId)) {
      _queue[messageId]!.retryCount++;
      _queue[messageId]!.lastRetryAt = DateTime.now();

      if (kDebugMode) {
        debugPrint(
          '🔄 Retry #${_queue[messageId]!.retryCount} for message: $messageId',
        );
      }
    }
  }

  /// Supprime un message de la queue (après succès)
  void remove(String messageId) {
    _queue.remove(messageId);
    if (kDebugMode) {
      debugPrint('✓ Message sent successfully: $messageId');
      debugPrint('Queue size: ${_queue.length}');
    }
  }

  /// Supprime les messages qui ont atteint le max de retries
  void removeFailedMessages() {
    final failed = _queue.values
        .where((msg) => msg.retryCount >= maxRetries)
        .map((msg) => msg.id)
        .toList();

    for (final id in failed) {
      _queue.remove(id);
      if (kDebugMode) {
        debugPrint('❌ Message removed after max retries: $id');
      }
    }
  }

  /// Vide la queue complètement
  void clear() {
    _queue.clear();
    if (kDebugMode) {
      debugPrint('🗑️ Message queue cleared');
    }
  }

  /// Nombre total de messages en attente
  int get size => _queue.length;

  /// Check si la queue est vide
  bool get isEmpty => _queue.isEmpty;
}
