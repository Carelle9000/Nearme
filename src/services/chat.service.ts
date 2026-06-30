import {
  ref,
  set,
  get,
  push,
  update,
  query,
  orderByChild,
  limitToLast,
  onValue,
  Unsubscribe,
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Conversation, Message } from '../models/user';

class ChatService {
  async createConversation(
    userId1: string,
    userId2: string,
    user1Name: string,
    user2Name: string
  ): Promise<Conversation> {
    const conversationId = [userId1, userId2].sort().join('_');
    const now = Date.now();

    const conversation: Conversation = {
      id: conversationId,
      participants: [userId1, userId2],
      participantNames: {
        [userId1]: user1Name,
        [userId2]: user2Name,
      },
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    await set(ref(rtdb, `conversations/${conversationId}`), {
      ...conversation,
      createdAt: now,
      updatedAt: now,
    });

    return conversation;
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
      const data = snapshot.val();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    }

    return this.createConversation(userId1, userId2, user1Name, user2Name);
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
      const conversations = Object.entries(conversationsObj)
        .map(([id, data]: any) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }))
        .filter((conv: any) => conv.participants.includes(userId))
        .sort((a: any, b: any) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

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
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      callback(messages);
    });
  }

  async markMessageAsRead(conversationId: string, messageId: string): Promise<void> {
    await update(ref(rtdb, `conversations/${conversationId}/messages/${messageId}`), {
      status: 'read',
      readAt: Date.now(),
    });
  }
}

export const chatService = new ChatService();
