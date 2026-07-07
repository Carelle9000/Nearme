import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  Unsubscribe,
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Conversation, Message } from '../models/user';
import { userService } from './user.service';

function normalizeParticipants(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  if (raw && typeof raw === 'object') return Object.keys(raw);
  return [];
}

function normalizeConversation(data: any): Conversation {
  return {
    ...data,
    participants: normalizeParticipants(data?.participants),
    createdAt: new Date(data?.createdAt ?? Date.now()),
    updatedAt: new Date(data?.updatedAt ?? Date.now()),
  };
}

class ChatService {
  async createConversation(
    userId1: string,
    userId2: string,
    user1Name: string,
    user2Name: string,
    user1Photo?: string,
    user2Photo?: string
  ): Promise<Conversation> {
    const conversationId = [userId1, userId2].sort().join('_');
    const now = Date.now();

    const data: any = {
      id: conversationId,
      participants: { [userId1]: true, [userId2]: true },
      participantNames: {
        [userId1]: user1Name,
        [userId2]: user2Name,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (user1Photo || user2Photo) {
      data.participantPhotos = {};
      if (user1Photo) data.participantPhotos[userId1] = user1Photo;
      if (user2Photo) data.participantPhotos[userId2] = user2Photo;
    }

    await set(ref(rtdb, `conversations/${conversationId}`), data);

    return {
      id: conversationId,
      participants: [userId1, userId2],
      participantNames: {
        [userId1]: user1Name,
        [userId2]: user2Name,
      },
      participantPhotos: data.participantPhotos,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async getOrCreateConversation(
    userId1: string,
    userId2: string,
    user1Name: string,
    user2Name: string
  ): Promise<Conversation> {
    const conversationId = [userId1, userId2].sort().join('_');
    const snapshot = await get(ref(rtdb, `conversations/${conversationId}`));

    if (snapshot.exists()) {
      return normalizeConversation(snapshot.val());
    }

    const [user1, user2] = await Promise.all([
      userService.getProfile(userId1),
      userService.getProfile(userId2),
    ]);

    return this.createConversation(
      userId1,
      userId2,
      user1Name,
      user2Name,
      user1?.photoUrl,
      user2?.photoUrl
    );
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' = 'text'
  ): Promise<Message> {
    const now = Date.now();
    const messagesRef = ref(rtdb, `conversations/${conversationId}/messages`);
    const newMessageRef = push(messagesRef);

    const messageData = {
      senderId,
      content,
      type,
      status: 'sent',
      createdAt: now,
      deliveredAt: null,
      readAt: null,
    };

    await set(newMessageRef, messageData);

    // Update conversation
    await update(ref(rtdb, `conversations/${conversationId}`), {
      lastMessage: content,
      lastMessageAt: now,
      updatedAt: now,
    });

    return {
      id: newMessageRef.key!,
      conversationId,
      senderId,
      content,
      type,
      status: 'sent',
      createdAt: new Date(now),
    };
  }

  async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const snapshot = await get(ref(rtdb, `conversations/${conversationId}/messages`));
      if (!snapshot.exists()) return [];

      const messagesObj = snapshot.val();
      const messages = Object.entries(messagesObj).map(([id, data]: any) => ({
        id,
        conversationId,
        ...data,
        createdAt: new Date(data.createdAt),
      }));

      return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const snapshot = await get(ref(rtdb, 'conversations'));
      if (!snapshot.exists()) return [];

      const conversationsObj = snapshot.val();
      let conversations = Object.entries(conversationsObj)
        .map(([id, data]: any) => normalizeConversation({ id, ...data }))
        .filter((conv) => conv.participants.includes(userId))
        .sort((a: any, b: any) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

      // Load photos for participants if not already in conversation
      conversations = await Promise.all(
        conversations.map(async (conv) => {
          if (!conv.participantPhotos) {
            conv.participantPhotos = {};
          }

          // Fill in missing photos
          for (const participantId of conv.participants) {
            if (!conv.participantPhotos[participantId]) {
              try {
                const profile = await userService.getProfile(participantId);
                if (profile?.photoUrl) {
                  conv.participantPhotos[participantId] = profile.photoUrl;
                }
              } catch (error) {
                console.warn(`Failed to fetch photo for participant ${participantId}`);
              }
            }
          }

          return conv;
        })
      );

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  onMessageUpdate(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    return onValue(ref(rtdb, `conversations/${conversationId}/messages`), (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const messagesObj = snapshot.val();
      const messages = Object.entries(messagesObj)
        .map(([id, data]: any) => ({
          id,
          conversationId,
          ...data,
          createdAt: new Date(data.createdAt),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      callback(messages);
    });
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const snapshot = await get(ref(rtdb, `conversations/${conversationId}`));
      if (!snapshot.exists()) return null;

      const data = snapshot.val();
      return normalizeConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      return null;
    }
  }

  async markMessageAsRead(conversationId: string, messageId: string): Promise<void> {
    await update(ref(rtdb, `conversations/${conversationId}/messages/${messageId}`), {
      status: 'read',
      readAt: Date.now(),
    });
  }
}

export const chatService = new ChatService();
