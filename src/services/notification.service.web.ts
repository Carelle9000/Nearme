import * as Notifications from 'expo-notifications';
import { ref, update } from 'firebase/database';
import { rtdb } from '../config/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    console.info('Push notifications not supported on web');
    return false;
  }

  async getFCMToken(): Promise<string | null> {
    console.info('Push notifications not available on web');
    return null;
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    // Web doesn't have FCM tokens
  }

  async sendLocalNotification(
    title: string,
    body: string,
    delay: number = 0
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger:
        delay > 0
          ? {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: delay,
            }
          : null,
    });
  }

  setupNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): () => void {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        callback(notification);
      }
    );

    return () => subscription.remove();
  }

  setupNotificationResponseListener(
    callback: (notification: Notifications.Notification) => void
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        callback(response.notification);
      }
    );

    return () => subscription.remove();
  }
}

export const notificationService = new NotificationService();
