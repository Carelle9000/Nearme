import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { ref, update } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // shouldShowAlert is deprecated in expo-notifications; kept for back-compat.
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // Check if we're on a platform that supports push notifications
  private isNotificationSupported(): boolean {
    // FCM is supported on iOS and Android
    // Web requires VAPID setup which is complex for dev
    return Platform.OS !== 'web';
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Skip on web
      if (!this.isNotificationSupported()) {
        console.info('Push notifications not supported on this platform');
        return false;
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      // Skip on web
      if (!this.isNotificationSupported()) {
        console.info('Push notifications not available on web');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return null;
      }

      // Get Firebase Cloud Messaging token
      const token = await messaging().getToken();
      return token || null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      await update(ref(rtdb, `profiles/${userId}`), {
        fcmToken: token,
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
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

  setupNotificationListener(
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
