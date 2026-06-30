import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notification.service';
import { useAuth } from './auth-context';

interface NotificationContextType {
  isNotificationEnabled: boolean;
  fcmToken: string | null;
  requestNotificationPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      initializeNotifications();
    }
  }, [user?.id]);

  const initializeNotifications = async () => {
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
  };

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

  // Setup notification listener
  useEffect(() => {
    const unsubscribe = notificationService.setupNotificationListener((notification) => {
      console.log('Notification received:', notification);
      // Handle notification tap or arrival
    });

    return unsubscribe;
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        isNotificationEnabled,
        fcmToken,
        requestNotificationPermission,
        sendLocalNotification,
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
