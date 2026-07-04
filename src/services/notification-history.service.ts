import { ref, push, query, orderByChild, equalTo, get, update, remove, DatabaseReference } from 'firebase/database';
import { rtdb } from '@/config/firebase';

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string;
  type?: 'like' | 'match' | 'message' | 'other';
  relatedUserId?: string;
  relatedMatchId?: string;
  isRead: boolean;
  createdAt: number;
  updatedAt: number;
}

class NotificationHistoryService {
  private getNotificationsRef(userId: string): DatabaseReference {
    return ref(rtdb, `notificationHistory/${userId}`);
  }

  async saveNotification(
    userId: string,
    notification: Omit<NotificationRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string | null> {
    try {
      const notificationRef = this.getNotificationsRef(userId);
      const now = Date.now();

      const newNotification = {
        ...notification,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };

      const pushed = await push(notificationRef, newNotification);
      return pushed.key;
    } catch (error) {
      console.error('Error saving notification:', error);
      return null;
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<NotificationRecord[]> {
    try {
      const notificationsRef = this.getNotificationsRef(userId);
      const snapshot = await get(notificationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const notifications: NotificationRecord[] = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key || '',
          userId,
          ...childSnapshot.val(),
        });
      });

      // Sort by createdAt descending (newest first)
      notifications.sort((a, b) => b.createdAt - a.createdAt);

      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsRef = this.getNotificationsRef(userId);
      const snapshot = await get(notificationsRef);

      if (!snapshot.exists()) {
        return 0;
      }

      let unreadCount = 0;
      snapshot.forEach((childSnapshot) => {
        if (!childSnapshot.val().isRead) {
          unreadCount++;
        }
      });

      return unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(rtdb, `notificationHistory/${userId}/${notificationId}`);
      await update(notificationRef, {
        isRead: true,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(userId, 1000);
      const updates: { [key: string]: unknown } = {};

      notifications.forEach((notification) => {
        if (!notification.isRead) {
          updates[`notificationHistory/${userId}/${notification.id}/isRead`] = true;
          updates[`notificationHistory/${userId}/${notification.id}/updatedAt`] = Date.now();
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(rtdb, `notificationHistory/${userId}/${notificationId}`);
      await remove(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const notificationsRef = this.getNotificationsRef(userId);
      await remove(notificationsRef);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export const notificationHistoryService = new NotificationHistoryService();
