import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Message } from '../models/user';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';
import { useAuth } from './auth-context';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createOrGetConversation: (otherUserId: string) => Promise<Conversation>;
  markAsRead: (conversationId: string, messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageUnsubscriber, setMessageUnsubscriber] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const conversations = await chatService.getConversations(user.id);
      setConversations(conversations);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      setCurrentConversation(conversation);
      setIsLoading(true);

      // Clean up previous listener
      if (messageUnsubscriber) {
        messageUnsubscriber();
      }

      // Load messages and set up real-time listener
      const initialMessages = await chatService.getMessages(conversationId);
      setMessages(initialMessages);

      const unsubscribe = chatService.onMessageUpdate(conversationId, (newMessages) => {
        setMessages(newMessages);
      });

      setMessageUnsubscriber(() => unsubscribe);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user?.id) return;

    try {
      await chatService.sendMessage(conversationId, user.id, content, 'text');
      // Message will appear via the real-time listener
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  const createOrGetConversation = async (otherUserId: string): Promise<Conversation> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const otherUser = await userService.getProfile(otherUserId);
      if (!otherUser) throw new Error('User not found');

      const conversation = await chatService.getOrCreateConversation(
        user.id,
        otherUserId,
        user.name || '',
        otherUser.name || ''
      );

      // Update conversations list
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) {
          return prev.map((c) => (c.id === conversation.id ? conversation : c));
        }
        return [conversation, ...prev];
      });

      return conversation;
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      throw err;
    }
  };

  const markAsRead = async (conversationId: string, messageId: string) => {
    try {
      await chatService.markMessageAsRead(conversationId, messageId);
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageUnsubscriber) {
        messageUnsubscriber();
      }
    };
  }, [messageUnsubscriber]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        isLoading,
        error,
        loadConversations,
        selectConversation,
        sendMessage,
        createOrGetConversation,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
