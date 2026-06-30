import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // Check if we're on a platform that supports push notifications
  private isNotificationSupported(): boolean {
    // Push notifications are supported on iOS and Android
    // Web requires VAPID setup which is complex for dev
    return Platform.OS !== 'web';
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Skip on web to avoid VAPID key requirement
      if (!this.isNotificationSupported()) {
        console.info('Push notifications not supported on this platform');
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      // Skip on web to avoid VAPID key requirement
      if (!this.isNotificationSupported()) {
        console.info('Push notifications not available on web');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return null;
      }

      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) {
        console.warn('Firebase project ID not configured');
        return null;
      }

      // For Expo, we use Expo's push notification service
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'profiles', userId), {
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
      trigger: delay > 0 ? { seconds: delay } : null,
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
