import { View, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { useLocalization } from '@/context/localization-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/models/user';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { userService } from '@/services/user.service';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocalization();
  const { selectConversation, currentConversation, messages, isLoading, sendMessage } = useChat();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [amBlockedByOther, setAmBlockedByOther] = useState(false);
  const [isBlockActing, setIsBlockActing] = useState(false);

  const otherUserId = id && currentConversation?.participants.find((pid) => pid !== user?.id);
  const otherUserPhoto = otherUserId ? currentConversation?.participantPhotos?.[otherUserId] : null;

  useEffect(() => {
    if (id) {
      selectConversation(id);
    }
  }, [id, selectConversation]);

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (user?.id && otherUserId) {
        try {
          const { iBlocked, iBlockThem } = await userService.isBlockedByEitherWay(user.id, otherUserId);
          setAmBlockedByOther(iBlocked);
          setIsBlocked(iBlockThem);
        } catch (error) {
          console.error('Error checking block status:', error);
        }
      }
    };
    checkBlockStatus();
  }, [user?.id, otherUserId]);

  const handleSendMessage = async () => {
    const text = messageText.trim();

    // Check if either user has blocked the other
    if (isBlocked) {
      Alert.alert(t('error') || 'Erreur', t('cannotSendMessage') || 'Vous ne pouvez pas envoyer de messages à ce profil');
      return;
    }

    if (amBlockedByOther) {
      Alert.alert(t('error') || 'Erreur', t('profileBlockedYou') || 'Ce profil vous a bloqué. Vous ne pouvez pas envoyer de messages.');
      return;
    }

    if (!text || !id || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(id, text);
      setMessageText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleBlock = () => {
    console.log('[handleBlock] called', { otherUserId, userId: user?.id, isBlockActing });
    if (!user?.id || !otherUserId || isBlockActing) {
      console.log('[handleBlock] early return', { otherUserId, userId: user?.id, isBlockActing });
      return;
    }

    // First confirmation popup
    Alert.alert(
      t('blockThisProfile') || 'Bloquer ce profil',
      t('blockThisProfileMessage') || 'Ce profil ne pourra plus vous voir ni vous contacter.',
      [
        {
          text: t('cancel') || 'Annuler',
          style: 'cancel',
        },
        {
          text: t('block') || 'Bloquer',
          style: 'destructive',
          onPress: () => {
            // Second confirmation popup for security
            Alert.alert(
              t('confirm') || 'Confirmer le blocage',
              t('confirmBlockMessage') || 'Êtes-vous sûr? Cette action ne peut pas être facilement annulée.',
              [
                {
                  text: t('cancel') || 'Non, retour',
                  style: 'cancel',
                },
                {
                  text: t('confirm') || 'Oui, bloquer',
                  style: 'destructive',
                  onPress: async () => {
                    setIsBlockActing(true);
                    try {
                      await userService.saveBlock(user.id, otherUserId);
                      setIsBlocked(true);
                      Alert.alert(
                        t('profileBlocked') || 'Profil bloqué',
                        'Ce profil a été bloqué avec succès. Vous ne pouvez plus envoyer de messages.'
                      );
                    } catch (error) {
                      console.error('Error blocking:', error);
                      Alert.alert(t('error') || 'Erreur', t('unableToBlockProfile') || 'Impossible de bloquer ce profil');
                    } finally {
                      setIsBlockActing(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleUnblock = () => {
    if (!user?.id || !otherUserId || isBlockActing) return;

    Alert.alert(
      t('unblockThisProfile') || 'Débloquer ce profil',
      t('unblockThisProfileMessage') || 'Ce profil pourra à nouveau vous voir et vous contacter.',
      [
        {
          text: t('cancel') || 'Annuler',
          style: 'cancel',
        },
        {
          text: t('unblock') || 'Débloquer',
          onPress: async () => {
            setIsBlockActing(true);
            try {
              await userService.unblock(user.id, otherUserId);
              setIsBlocked(false);
              Alert.alert(
                t('profileUnblocked') || 'Profil débloqué',
                'Ce profil a été débloqué avec succès.'
              );
            } catch (error) {
              console.error('Error unblocking:', error);
              Alert.alert(t('error') || 'Erreur', t('unableToUnblockProfile') || 'Impossible de débloquer ce profil');
            } finally {
              setIsBlockActing(false);
            }
          },
        },
      ]
    );
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
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container} pointerEvents="box-none">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {otherUserPhoto && (
            <Image
              source={{ uri: otherUserPhoto }}
              style={styles.headerPhoto}
            />
          )}
          <Text style={styles.headerTitle}>
            {currentConversation?.participantNames?.[
              currentConversation.participants.find((id) => id !== user?.id) || ''
            ] || 'Chat'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={isBlocked ? handleUnblock : handleBlock}
          disabled={isBlockActing}
          style={{ opacity: isBlockActing ? 0.6 : 1 }}
        >
          {isBlockActing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons
              name="ban"
              size={24}
              color={isBlocked ? '#E74C3C' : Colors.primary}
            />
          )}
        </TouchableOpacity>
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
      <View style={styles.inputContainer} pointerEvents={isSending ? 'none' : 'auto'}>
        <TextInput
          style={styles.input}
          placeholder={t('typeMessage')}
          value={messageText}
          onChangeText={setMessageText}
          editable={!isSending}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (isSending || !messageText.trim()) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={isSending}
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
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
