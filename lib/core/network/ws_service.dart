import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../config/app_config.dart';

/// Service WebSocket pour le chat en temps réel.
///
/// Usage :
///   ws.connect(accessToken);
///   ws.joinMatch(matchId);
///   ws.sendMessage(matchId, 'Salut !');
///   ws.messages.listen((msg) => ...);
///   ws.disconnect();
class WsService {
  WebSocketChannel? _channel;
  StreamController<WsMessage>? _controller;
  bool _connected = false;
  String? _token;

  // ── Stream public ─────────────────────────────────────────────────────────

  Stream<WsMessage> get messages =>
      (_controller ??= StreamController.broadcast()).stream;

  bool get isConnected => _connected;

  // ── Connexion ─────────────────────────────────────────────────────────────

  Future<void> connect(String accessToken) async {
    if (_connected) return;
    _token = accessToken;
    _controller ??= StreamController.broadcast();

    try {
      final uri = Uri.parse('${AppConfig.wsUrl}/ws?token=$accessToken');
      _channel = WebSocketChannel.connect(uri);

      _channel!.stream.listen(
        _onData,
        onDone:  _onDone,
        onError: _onError,
      );

      _connected = true;
      debugPrint('[WS] Connected');
    } catch (e) {
      debugPrint('[WS] Connection error: $e');
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _connected = false;
    debugPrint('[WS] Disconnected');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  void joinMatch(String matchId) =>
      _send({'type': 'join', 'match_id': matchId});

  void sendMessage(String matchId, String content) =>
      _send({'type': 'send_message', 'match_id': matchId, 'content': content});

  void markRead(String matchId) =>
      _send({'type': 'mark_read', 'match_id': matchId});

  // ── Interne ───────────────────────────────────────────────────────────────

  void _send(Map<String, dynamic> payload) {
    if (!_connected || _channel == null) return;
    _channel!.sink.add(jsonEncode(payload));
  }

  void _onData(dynamic raw) {
    if (raw is! String) return;
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final type = data['type'] as String? ?? '';

      switch (type) {
        case 'new_message':
          final msg = data['message'] as Map<String, dynamic>?;
          if (msg != null) {
            _controller?.add(WsMessage.fromJson(msg));
          }
        case 'error':
          debugPrint('[WS] Server error: ${data['message']}');
        default:
          debugPrint('[WS] Unknown type: $type');
      }
    } catch (e) {
      debugPrint('[WS] Parse error: $e');
    }
  }

  void _onDone() {
    _connected = false;
    debugPrint('[WS] Connection closed — will reconnect on next action');
    // Reconnexion automatique après 3 s si un token est disponible
    if (_token != null) {
      Future.delayed(const Duration(seconds: 3), () => connect(_token!));
    }
  }

  void _onError(Object error) {
    debugPrint('[WS] Error: $error');
    _connected = false;
  }
}

// ── Modèle de message reçu ────────────────────────────────────────────────────

class WsMessage {
  final String id;
  final String matchId;
  final String senderId;
  final String content;
  final DateTime sentAt;
  final DateTime? readAt;

  const WsMessage({
    required this.id,
    required this.matchId,
    required this.senderId,
    required this.content,
    required this.sentAt,
    this.readAt,
  });

  factory WsMessage.fromJson(Map<String, dynamic> j) => WsMessage(
        id:       j['id'] as String,
        matchId:  j['match_id'] as String,
        senderId: j['sender_id'] as String,
        content:  j['content'] as String,
        sentAt:   DateTime.parse(j['sent_at'] as String).toLocal(),
        readAt:   j['read_at'] != null
            ? DateTime.parse(j['read_at'] as String).toLocal()
            : null,
      );
}
