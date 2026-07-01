import { View, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat } from '../../context/chat-context';
import { useAuth } from '../../context/auth-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../models/user';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { selectConversation, currentConversation, messages, isLoading, sendMessage } = useChat();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id) {
      selectConversation(id);
    }
  }, [id, selectConversation]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !id) return;

    setIsSending(true);
    try {
      await sendMessage(id, messageText.trim());
      setMessageText('');
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;

    return (
      <View style={[styles.messageRow, isOwn && styles.ownMessage]}>
        <View style={[styles.messageBubble, isOwn && styles.ownBubble]}>
          <Text style={[styles.messageText, isOwn && styles.ownText]}>{item.content}</Text>
          <Text style={[styles.messageTime, isOwn && styles.ownTime]}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading && messages.length === 0) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentConversation?.participantNames?.[
            currentConversation.participants.find((id) => id !== user?.id) || ''
          ] || 'Chat'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={true}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tapez un message..."
          value={messageText}
          onChangeText={setMessageText}
          editable={!isSending}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={isSending || !messageText.trim()}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardSurface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.base,
    ...Shadows.soft,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
  },
  messageText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 20,
  },
  ownText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.cardSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: Colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
