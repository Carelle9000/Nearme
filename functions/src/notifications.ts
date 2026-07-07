import { onValueWritten } from 'firebase-functions/v2/database';
import * as admin from 'firebase-admin';
import { rtdb } from './firebase';

const messaging = admin.messaging();

async function sendFCMNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  if (!fcmToken) {
    console.warn('No FCM token provided');
    return false;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
          },
        },
      },
    };

    const response = await messaging.send({
      ...message,
      token: fcmToken,
    } as admin.messaging.Message);

    console.log('✅ Notification sent:', { title, body, token: fcmToken.slice(0, 20), msgId: response });
    return true;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    return false;
  }
}

async function getUserProfile(userId: string) {
  try {
    const snapshot = await rtdb.ref(`profiles/${userId}`).get();
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const snapshot = await rtdb.ref(`profiles/${userId}`).get();
    const profile = snapshot.val();

    if (!profile?.fcmToken) {
      console.warn(`No FCM token for user ${userId}`);
      return false;
    }

    return sendFCMNotification(profile.fcmToken, title, body, data);
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Notification when someone likes your profile
export const onLikeReceived = onValueWritten(
  'profiles/{uid}/received_likes/{senderId}',
  async (event) => {
    const uid = event.params.uid; // Profile owner
    const senderId = event.params.senderId; // Person who liked
    const after = event.data.after.val();

    // Ignore if deleted
    if (!after) {
      console.log('Like deleted, skipping notification');
      return;
    }

    try {
      const senderProfile = await getUserProfile(senderId);
      if (!senderProfile) {
        console.warn(`Sender profile not found: ${senderId}`);
        return;
      }

      const senderName = senderProfile.displayName || senderProfile.name || 'Quelqu\'un';
      const title = 'Nouvel intérêt';
      const body = `${senderName} s'intéresse à vous`;

      await sendNotificationToUser(uid, title, body, {
        type: 'like',
        senderId,
        senderName,
      });
    } catch (error) {
      console.error('Error processing like notification:', error);
    }
  }
);

// Notification when you match with someone
export const onMatchCreated = onValueWritten('matches/{matchId}', async (event) => {
  const matchId = event.params.matchId;
  const after = event.data.after.val();
  const before = event.data.before.val();

  // Only notify on creation, not updates
  if (before || !after) {
    return;
  }

  try {
    const { userId1, userId2 } = after;

    // Get both user profiles
    const [profile1, profile2] = await Promise.all([
      getUserProfile(userId1),
      getUserProfile(userId2),
    ]);

    if (!profile1 || !profile2) {
      console.warn('One or both profiles not found for match');
      return;
    }

    const user1Name = profile1.displayName || profile1.name || 'Quelqu\'un';
    const user2Name = profile2.displayName || profile2.name || 'Quelqu\'un';

    // Notify user1
    await sendNotificationToUser(userId1, 'Nouveau match! 🎉', `Vous avez matché avec ${user2Name}`, {
      type: 'match',
      otherUserId: userId2,
      otherUserName: user2Name,
      matchId,
    });

    // Notify user2
    await sendNotificationToUser(userId2, 'Nouveau match! 🎉', `Vous avez matché avec ${user1Name}`, {
      type: 'match',
      otherUserId: userId1,
      otherUserName: user1Name,
      matchId,
    });
  } catch (error) {
    console.error('Error processing match notification:', error);
  }
});

// Notification when you receive a message
export const onMessageReceived = onValueWritten(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const conversationId = event.params.conversationId;
    const messageId = event.params.messageId;
    const after = event.data.after.val();
    const before = event.data.before.val();

    // Only notify on creation, not updates
    if (before || !after) {
      return;
    }

    try {
      const { senderId, content, type } = after;

      // Extract recipient ID from conversation ID (format: userId1_userId2)
      const [user1, user2] = conversationId.split('_');
      const recipientId = senderId === user1 ? user2 : user1;

      // Get sender profile
      const senderProfile = await getUserProfile(senderId);
      if (!senderProfile) {
        console.warn(`Sender profile not found: ${senderId}`);
        return;
      }

      const senderName = senderProfile.displayName || senderProfile.name || 'Quelqu\'un';

      // Format message preview
      let messagePreview = content;
      if (type === 'image') {
        messagePreview = '📷 A envoyé une photo';
      } else if (content.length > 50) {
        messagePreview = content.slice(0, 50) + '...';
      }

      const title = senderName;
      const body = messagePreview;

      await sendNotificationToUser(recipientId, title, body, {
        type: 'message',
        senderId,
        senderName,
        conversationId,
        messageId,
      });
    } catch (error) {
      console.error('Error processing message notification:', error);
    }
  }
);
