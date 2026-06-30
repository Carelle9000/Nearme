import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Conversation, Message } from '../models/user';

class ChatService {
  async createConversation(
    userId1: string,
    userId2: string,
    user1Name: string,
    user2Name: string
  ): Promise<Conversation> {
    const conversationId = [userId1, userId2].sort().join('_');

    const conversation: Conversation = {
      id: conversationId,
      participants: [userId1, userId2],
      participantNames: {
        [userId1]: user1Name,
        [userId2]: user2Name,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'conversations', conversationId), {
      ...conversation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    const docSnap = await getDoc(doc(db, 'conversations', conversationId));

    if (docSnap.exists()) {
      return docSnap.data() as Conversation;
    }

    return this.createConversation(userId1, userId2, user1Name, user2Name);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' = 'text'
  ): Promise<Message> {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);

    const messageData = {
      senderId,
      content,
      type,
      status: 'sent',
      createdAt: serverTimestamp(),
      deliveredAt: null,
      readAt: null,
      errorMessage: null,
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update conversation last message
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: content,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      conversationId,
      senderId,
      content,
      type,
      status: 'sent',
      createdAt: new Date(),
    };
  }

  async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const q = query(
        collection(db, `conversations/${conversationId}/messages`),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          conversationId,
          ...(doc.data() as Omit<Message, 'id' | 'conversationId'>),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }))
        .reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...(doc.data() as Conversation),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate?.(),
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  onMessageUpdate(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        conversationId,
        ...(doc.data() as Omit<Message, 'id' | 'conversationId'>),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      callback(messages);
    });
  }

  async markMessageAsRead(conversationId: string, messageId: string): Promise<void> {
    await updateDoc(doc(db, `conversations/${conversationId}/messages/${messageId}`), {
      status: 'read',
      readAt: serverTimestamp(),
    });
  }
}

export const chatService = new ChatService();
