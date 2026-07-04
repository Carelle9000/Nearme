import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/notification.service';
import { notificationHistoryService, type NotificationRecord } from '../services/notification-history.service';
import { useAuth } from './auth-context';

interface NotificationContextType {
  isNotificationEnabled: boolean;
  fcmToken: string | null;
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const initializeNotifications = useCallback(async () => {
    try {
      const token = await notificationService.getFCMToken();
      if (token) {
        setFcmToken(token);
        setIsNotificationEnabled(true);
        // Save token to user profile
        if (user?.id) {
          await notificationService.saveFCMToken(user.id, token);
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const loaded = await notificationHistoryService.getNotifications(user.id);
      setNotifications(loaded);

      const unread = await notificationHistoryService.getUnreadCount(user.id);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    try {
      await notificationHistoryService.markAsRead(user.id, notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await notificationHistoryService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    try {
      await notificationHistoryService.deleteNotification(user.id, notificationId);
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        const newUnreadCount = updated.filter((n) => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  const clearAllNotifications = async () => {
    if (!user?.id) return;
    try {
      await notificationHistoryService.clearAllNotifications(user.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      initializeNotifications();
      loadNotifications();
    }
  }, [user?.id, initializeNotifications, loadNotifications]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        await initializeNotifications();
      }
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendLocalNotification = async (title: string, body: string): Promise<void> => {
    try {
      await notificationService.sendLocalNotification(title, body);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const handleNotification = useCallback(async (notification: any) => {
    console.log('Notification received:', notification);
    if (!user?.id) return;

    const title = notification.request.content.title || 'Notification';
    const body = notification.request.content.body || '';
    const data = notification.request.content.data || {};

    await notificationHistoryService.saveNotification(user.id, {
      title,
      body,
      type: (data.type as 'like' | 'match' | 'message' | 'other') || 'other',
      relatedUserId: data.relatedUserId as string | undefined,
      relatedMatchId: data.relatedMatchId as string | undefined,
      userId: user.id,
    });

    await loadNotifications();
  }, [user, loadNotifications]);

  useEffect(() => {
    const unsubscribeReceived = notificationService.setupNotificationReceivedListener(
      handleNotification
    );
    const unsubscribeResponse = notificationService.setupNotificationResponseListener(
      handleNotification
    );

    return () => {
      unsubscribeReceived();
      unsubscribeResponse();
    };
  }, [handleNotification]);

  return (
    <NotificationContext.Provider
      value={{
        isNotificationEnabled,
        fcmToken,
        notifications,
        unreadCount,
        isLoading,
        requestNotificationPermission,
        sendLocalNotification,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
