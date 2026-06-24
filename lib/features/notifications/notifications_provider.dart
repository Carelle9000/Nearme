import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../data/models/app_notification.dart';
import '../../data/services/notification_service.dart';

class NotificationsProvider extends ChangeNotifier {
  final NotificationService _service = NotificationService();
  StreamSubscription? _subscription;
  List<AppNotification> _notifications = [];
  int _unreadCount = 0;

  List<AppNotification> get notifications => _notifications;
  int get unreadCount => _unreadCount;

  void init(String userId) {
    _subscription?.cancel();
    _subscription = _service.getNotifications(userId).listen((list) {
      _notifications = list;
      _unreadCount = list.where((n) => !n.isRead).length;
      notifyListeners();
    });
  }

  Future<void> markAsRead(String userId, String notificationId) async {
    await _service.markAsRead(userId, notificationId);
  }

  Future<void> markAllAsRead(String userId) async {
    await _service.markAllAsRead(userId);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
