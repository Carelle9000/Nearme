import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

  // Bug #11: use a ref for the message listener so subscribing/unsubscribing
  // doesn't cause a re-render, and store the current conversation id we're
  // subscribed to so we can skip work when nothing changed.
  const messageUnsubscribeRef = useRef<null | (() => void)>(null);
  const subscribedConversationIdRef = useRef<string | null>(null);
  // Read latest conversations without adding to selectConversation's deps.
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  const teardownMessagesListener = useCallback(() => {
    if (messageUnsubscribeRef.current) {
      messageUnsubscribeRef.current();
      messageUnsubscribeRef.current = null;
    }
    subscribedConversationIdRef.current = null;
  }, []);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const conversations = await chatService.getConversations(user.id);
      setConversations(conversations);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  const selectConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    // Already subscribed to this conversation — nothing to do. This is the
    // primary guard against listener pile-up when the caller's useEffect re-runs.
    if (subscribedConversationIdRef.current === conversationId) return;

    const conversation = conversationsRef.current.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Tear down any previous listener BEFORE creating the new one so we can
    // never have two active at once.
    teardownMessagesListener();

    setCurrentConversation(conversation);
    setIsLoading(true);

    try {
      const initialMessages = await chatService.getMessages(conversationId);
      setMessages(initialMessages);

      messageUnsubscribeRef.current = chatService.onMessageUpdate(
        conversationId,
        (newMessages) => setMessages(newMessages)
      );
      subscribedConversationIdRef.current = conversationId;
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les messages');
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, teardownMessagesListener]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user?.id) return;

    try {
      await chatService.sendMessage(conversationId, user.id, content, 'text');
      // Message will appear via the real-time listener
    } catch (err: any) {
      setError(err.message || 'Impossible d\'envoyer le message');
      console.error('Error sending message:', err);
    }
  }, [user?.id]);

  const createOrGetConversation = useCallback(async (otherUserId: string): Promise<Conversation> => {
    if (!user?.id) throw new Error('Utilisateur non authentifié');

    try {
      const otherUser = await userService.getProfile(otherUserId);
      if (!otherUser) throw new Error('Utilisateur non trouvé');

      const conversation = await chatService.getOrCreateConversation(
        user.id,
        otherUserId,
        user.name || '',
        otherUser.name || ''
      );

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) {
          return prev.map((c) => (c.id === conversation.id ? conversation : c));
        }
        return [conversation, ...prev];
      });

      return conversation;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer la conversation');
      throw err;
    }
  }, [user?.id, user?.name]);

  const markAsRead = useCallback(async (conversationId: string, messageId: string) => {
    try {
      await chatService.markMessageAsRead(conversationId, messageId);
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Tear down the listener on unmount only. No re-run on unrelated state changes.
  useEffect(() => teardownMessagesListener, [teardownMessagesListener]);

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
